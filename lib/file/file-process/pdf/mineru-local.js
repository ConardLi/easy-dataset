import http from 'http';
import https from 'https';
import { getProjectRoot } from '@/lib/db/base';
import fs from 'fs';
import path from 'path';
import {
  DEFAULT_MINERU_MAX_PAGES_PER_FILE,
  createPdfProcessingParts,
  mergeMarkdownParts
} from './split.mjs';

const MINERU_BASE_URL = 'file_parse';

export async function minerULocalProcessing(projectId, fileName, options = {}) {
  console.log('executing pdf mineru local conversion strategy......');

  const { updateTask, task, message } = options;

  let taskCompletedCount = task.completedCount;
  let pdfPartsPlan;

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
    console.error('Error getting MinerU token configuration:', error);
    throw new Error('Token configuration not found, please check if MinerU token is configured in task settings');
  }

  const url = taskConfig?.minerULocalUrl;
  if (url === undefined || url === null || url === '') {
    throw new Error(
      'MinerU local URL configuration not found, please check if MinerU local URL is configured in task settings'
    );
  }

  const uploadUrl = url.endsWith('/') ? url + MINERU_BASE_URL : url + '/' + MINERU_BASE_URL;
  try {
    const totalPages = message?.current?.totalPage || 1;
    pdfPartsPlan = await createPdfProcessingParts(filePath, {
      fileName,
      totalPages,
      maxPages: DEFAULT_MINERU_MAX_PAGES_PER_FILE
    });

    if (pdfPartsPlan.didSplit) {
      console.log(`mineru local split ${fileName} into ${pdfPartsPlan.parts.length} parts`);
    }

    const markdownParts = [];
    for (const part of pdfPartsPlan.parts) {
      message.current.processedPage = part.startPage;
      message.stepInfo = `processing ${fileName} part ${part.partIndex} pages ${part.startPage}-${part.endPage}`;
      await updateTask(task.id, {
        completedCount: taskCompletedCount + part.startPage - 1,
        detail: JSON.stringify(message)
      });

      const mdContent = await processLocalMinerUPart(part.filePath, uploadUrl);
      markdownParts.push(mdContent);

      message.current.processedPage = part.endPage;
      message.stepInfo = `processing ${fileName} part ${part.partIndex} pages ${part.startPage}-${part.endPage} completed`;
      await updateTask(task.id, {
        completedCount: taskCompletedCount + part.endPage,
        detail: JSON.stringify(message)
      });
    }

    const outputPath = filePath.replace(/\.pdf$/i, '.md');
    fs.writeFileSync(outputPath, mergeMarkdownParts(markdownParts), { encoding: 'utf8' });
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  } finally {
    if (pdfPartsPlan?.cleanup) {
      await pdfPartsPlan.cleanup();
    }
  }
  console.log('minerU local url processing completed');
  return { success: true };
}

async function processLocalMinerUPart(filePath, uploadUrl) {
  const uploadResponse = await processingFile(filePath, uploadUrl);
  const jsonContent = JSON.parse(uploadResponse);
  const resultKey = Object.keys(jsonContent.results || {})[0];
  const mdContent = resultKey ? jsonContent.results[resultKey]?.md_content : '';

  if (!mdContent) {
    throw new Error(`MinerU local response does not contain markdown content for ${path.basename(filePath)}`);
  }

  return mdContent;
}

/**
 * 将文件传送到本地mineru解析
 */
async function processingFile(filePath, uploadUrl) {
  return new Promise((resolve, reject) => {
    const isHttps = uploadUrl.startsWith('https');
    const url = new URL(uploadUrl);
    const client = url.protocol === 'https:' ? https : http;
    const FormData = require('form-data');
    const form = new FormData();
    form.append('files', fs.createReadStream(filePath));

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: form.getHeaders()
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

    form.pipe(req);
  });
}

export default {
  minerULocalProcessing
};
