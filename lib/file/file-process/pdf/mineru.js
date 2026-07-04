import http from 'http';
import https from 'https';
import AdmZip from 'adm-zip';
import { getProjectRoot } from '@/lib/db/base';
import fs from 'fs';
import path from 'path';
import {
  DEFAULT_MINERU_MAX_PAGES_PER_FILE,
  createPdfProcessingParts,
  mergeMarkdownParts
} from './split.mjs';

const MINERU_API_BASE = 'https://mineru.net/api/v4';
const POLL_INTERVAL = 3000; // 3秒
const MAX_POLL_ATTEMPTS = 90; // 最多尝试90次
const PROCESSING_STATES = {
  DONE: 'done',
  FAILED: 'failed'
};

export async function minerUProcessing(projectId, fileName, options = {}) {
  console.log('executing pdf mineru conversion strategy......');
  let pdfPartsPlan;
  try {
    const { updateTask, task, message } = options;

    let taskCompletedCount = task.completedCount;

    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const filePath = path.join(projectPath, 'files', fileName);

    const taskConfigPath = path.join(projectPath, 'task-config.json');
    let taskConfig;
    try {
      await fs.promises.access(taskConfigPath);
      const taskConfigData = await fs.promises.readFile(taskConfigPath, 'utf8');
      taskConfig = JSON.parse(taskConfigData);
    } catch (error) {
      console.error('error getting mineru token configuration:', error);
      throw new Error('token configuration not found, please check if mineru token is configured in task settings');
    }

    const key = taskConfig?.minerUToken;
    if (key === undefined || key === null || key === '') {
      throw new Error('token configuration not found, please check if mineru token is configured in task settings');
    }

    const totalPages = message?.current?.totalPage || 1;
    pdfPartsPlan = await createPdfProcessingParts(filePath, {
      fileName,
      totalPages,
      maxPages: DEFAULT_MINERU_MAX_PAGES_PER_FILE
    });

    if (pdfPartsPlan.didSplit) {
      console.log(`mineru split ${fileName} into ${pdfPartsPlan.parts.length} parts`);
    }

    const markdownParts = [];
    for (const part of pdfPartsPlan.parts) {
      const markdown = await processMinerUPart({
        key,
        fileName,
        part,
        totalPages,
        task,
        updateTask,
        message,
        taskCompletedCount
      });
      markdownParts.push(markdown);
    }

    const outputPath = path.join(projectPath, 'files', fileName.replace(/\.pdf$/i, '.md'));
    fs.writeFileSync(outputPath, mergeMarkdownParts(markdownParts), { encoding: 'utf8' });
    console.log('mineru pdf conversion completed!');
    return { success: true };
  } catch (error) {
    console.error('mineru api call error:', error);
    throw error;
  } finally {
    if (pdfPartsPlan?.cleanup) {
      await pdfPartsPlan.cleanup();
    }
  }
}

async function processMinerUPart({ key, fileName, part, totalPages, task, updateTask, message, taskCompletedCount }) {
  const requestOptions = JSON.stringify({
    enable_formula: true,
    layout_model: 'doclayout_yolo',
    enable_table: true,
    files: [{ name: part.fileName, is_ocr: true, data_id: String(part.partIndex) }]
  });

  console.log(`mineru getting file upload url for ${part.fileName}...`);
  const urlResponse = await makeHttpRequest(`${MINERU_API_BASE}/file-urls/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestOptions),
      Authorization: `Bearer ${key}`
    },
    body: requestOptions
  });

  if (urlResponse.code !== 0 || !urlResponse.data?.file_urls?.[0]) {
    throw new Error('failed to get file upload url: ' + JSON.stringify(urlResponse));
  }

  const uploadUrl = urlResponse.data?.file_urls?.[0];
  const batchId = urlResponse.data?.batch_id;

  console.log(`mineru uploading ${part.fileName}...`);
  await uploadFile(part.filePath, uploadUrl);
  console.log(`mineru upload completed for ${part.fileName}!`);

  console.log(`mineru starting to check task progress for ${part.fileName}...`);
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const resultResponse = await makeHttpRequest(`${MINERU_API_BASE}/extract-results/batch/${batchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      }
    });

    const currentState = resultResponse.data?.extract_result?.[0]?.state;
    const extractProgress = resultResponse.data?.extract_result?.[0]?.extract_progress;
    const extractedPages = extractProgress ? extractProgress.extracted_pages : 0;
    const partProcessedPage = currentState === PROCESSING_STATES.DONE ? part.pageCount : extractedPages;
    const processedPage = Math.min(part.startPage - 1 + partProcessedPage, totalPages);
    const progress = totalPages > 0 ? (processedPage / totalPages) * 100 : 0;

    message.current.processedPage = processedPage;
    message.stepInfo = `processing ${fileName} part ${part.partIndex} pages ${part.startPage}-${part.endPage}, progress: ${progress}%`;

    await updateTask(task.id, {
      completedCount: taskCompletedCount + processedPage,
      detail: JSON.stringify(message)
    });

    console.log(
      `mineru ${part.fileName} current progress: ${partProcessedPage}/${part.pageCount}, status: ${currentState}`
    );

    if (resultResponse.code === 0 && currentState === PROCESSING_STATES.DONE) {
      const zipUrl = resultResponse.data.extract_result[0].full_zip_url;
      return await downloadAndExtractMarkdown(zipUrl);
    }
    if (resultResponse.code !== 0 || currentState === PROCESSING_STATES.FAILED) {
      throw new Error(`task processing failed: ${JSON.stringify(resultResponse)}`);
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error(`mineru task timed out for ${part.fileName}`);
}

/**
 * 发送 HTTP 请求
 */
async function makeHttpRequest(url, options) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method: options.method,
      headers: options.headers
    };

    const req = client.request(requestOptions, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`request failed, status code: ${res.statusCode}, response: ${data}`));
          }
        } catch (error) {
          reject(new Error('failed to parse response'));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * 上传文件至MinerU指定地址
 */
async function uploadFile(filePath, uploadUrl) {
  return new Promise((resolve, reject) => {
    const isHttps = uploadUrl.startsWith('https');
    const url = new URL(uploadUrl);
    const client = url.protocol === 'https:' ? https : http;
    const fileStream = fs.createReadStream(filePath);
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method: 'PUT'
    };

    const req = client.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(responseData);
        } else {
          reject(new Error(`Upload failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    fileStream.pipe(req);
  });
}

async function downloadAndExtractMarkdown(zipUrl) {
  const zipBuffer = await new Promise((resolve, reject) => {
    https.get(zipUrl, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });

  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();
  for (const entry of zipEntries) {
    if (entry.entryName.toLowerCase().endsWith('.md')) {
      const content = zip.readFile(entry);
      return content.toString('utf8');
    }
  }
  throw new Error('mineru result zip does not contain markdown file');
}

export default {
  minerUProcessing
};
