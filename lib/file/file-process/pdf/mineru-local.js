import http from 'http';
import https from 'https';
import { getProjectRoot } from '@/lib/db/base';
import fs from 'fs';
import path from 'path';

const MINERU_BASE_URL = 'file_parse';

export async function minerULocalProcessing(projectId, fileName, options = {}) {
  console.log('executing pdf mineru local conversion strategy......');

  const { updateTask, task, message } = options;

  let taskCompletedCount = task.completedCount;

  // 获取项目路径
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const filePath = path.join(projectPath, 'files', fileName);

  // 读取任务配置
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
    message.current.processedPage = parseInt(message.current.totalPage / 2) + 1;
    await updateTask(task.id, {
      detail: JSON.stringify(message)
    });

    const uploadResponse = await processingFile(filePath, uploadUrl);
    //返回的结果是字符串，先转成json
    const jsonContent = JSON.parse(uploadResponse);

    const resultKey = Object.keys(jsonContent.results)[0];

    const mdContent = jsonContent.results[resultKey].md_content;

    const outputPath = filePath.replace('.pdf', '.md');
    fs.writeFileSync(outputPath, mdContent);
    console.log('minerU local url processing completed');
    return { success: true, path: outputPath };
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
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
