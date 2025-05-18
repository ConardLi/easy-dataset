const http = require('http');
const https = require('https');
import AdmZip from 'adm-zip';
import { getProjectRoot } from '@/lib/db/base';
import taskManager from '@/lib/task/taskManager';
import fs from 'fs';
import path from 'path';
import strategy from '.';

// 常量定义
const MINERU_API_BASE = 'https://mineru.net/api/v4';
const POLL_INTERVAL = 3000; // 3秒
const MAX_POLL_ATTEMPTS = 90; // 最多尝试90次
const PROCESSING_STATES = {
  DONE: 'done',
  FAILED: 'failed'
};

class MinerUStrategy {
  async process(projectId, fileName) {
    console.log('正在执行PDF MinerU转换策略......');
    try {
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
        console.error('获取 MinerU Token 配置出错:', error);
        throw new Error('未获取到Token配置，请检查任务配置中是否配置MinerU Token');
      }

      const key = taskConfig?.minerUToken;
      if (key === undefined || key === null || key === '') {
        throw new Error('未获取到Token配置，请检查任务配置中是否配置MinerU Token');
      }

      // 准备请求选项
      const requestOptions = JSON.stringify({
        enable_formula: true,
        layout_model: 'doclayout_yolo',
        enable_table: true,
        files: [{ name: fileName, is_ocr: true, data_id: 'abcd' }]
      });
      // 1. 获取文件上传地址
      console.log('MinerU 获取文件上传地址...');
      const urlResponse = await this._makeHttpRequest(`${MINERU_API_BASE}/file-urls/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestOptions),
          Authorization: `Bearer ${key}`
        },
        body: requestOptions
      });

      if (urlResponse.code !== 0 || !urlResponse.data?.file_urls?.[0]) {
        throw new Error('获取文件上传地址失败: ' + JSON.stringify(urlResponse));
      }

      //上传文件后会自动执行任务
      let batchId = null;
      let uploadUrl = null;
      console.log('MinerU 执行上传文件任务...');
      if (urlResponse.code == 0) {
        //上传文件地址
        uploadUrl = urlResponse.data?.file_urls?.[0];
        //此次任务id
        batchId = urlResponse.data?.batch_id;
      }
      // 2. 上传文件
      await this._uploadFile(filePath, uploadUrl);
      console.log('MinerU 上传文件完成！');

      // 3. 轮询查询转换状态
      console.log('MinerU 开始查询任务进度...');
      // 回写数据库的任务函数
      const taskFn = async updateProgress => {
        let zipUrl = null;
        let currentPage = 0;
        let totalPage = 0;
        await new Promise(resolve => {
          const interval = setInterval(async () => {
            try {
              //查询任务进度API
              const resultResponse = await this._makeHttpRequest(
                `${MINERU_API_BASE}/extract-results/batch/${batchId}`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`
                  }
                }
              );

              // 任务状态
              const currentState = resultResponse.data?.extract_result?.[0]?.state;
              const extract_progress = resultResponse.data?.extract_result?.[0]?.extract_progress;

              if (extract_progress) {
                // 任务进度
                currentPage = extract_progress.extracted_pages;
                // 总页数
                totalPage = extract_progress.total_pages;
              } else {
                currentPage = totalPage;
              }
              await updateProgress(Number((currentPage / totalPage) * 100) || 0, {
                strategy: 'minerU',
                current: currentPage,
                total: totalPage,
                taskStatus: currentState,
                zipUrl: zipUrl
              });
              console.log(`MinerU 当前进度: ${currentPage}/${totalPage} , 状态: ${currentState}`);
              if (resultResponse.code === 0 && currentState === PROCESSING_STATES.DONE) {
                zipUrl = resultResponse.data.extract_result[0].full_zip_url;
                const savePath = path.join(projectPath, 'files');
                await this._downloadAndExtractZip(zipUrl, savePath, fileName);
                clearInterval(interval);
                resolve();
              }
              // 检查是否失败
              if (resultResponse.code !== 0 || currentState === PROCESSING_STATES.FAILED) {
                clearInterval(interval);
                resolve();
                throw new Error(`任务处理失败: ${JSON.stringify(resultResponse)}`);
              }
            } catch (error) {
              clearInterval(interval);
              resolve();
              throw error;
            }
          }, 2000);
        });
        console.log('MinerU PDF转换完成！');
      };
      //创建任务
      const task = await taskManager.createTask('MinerU_API:' + fileName, '', projectId);

      //开始执行任务
      taskManager.startTask(task, taskFn).catch(err => console.error('Task error:', err));
      return task.id;
    } catch (error) {
      console.error('MinerU API 调用出错:', error);
      throw error;
    }
  }

  /**
   * 获取任务执行完成后的压缩包，仅解压md文件
   * @private
   */
  async _downloadAndExtractZip(zipUrl, targetDir, fileName) {
    // 创建目标目录
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 下载 ZIP 文件到内存
    const zipBuffer = await new Promise((resolve, reject) => {
      https.get(zipUrl, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
    });

    // 解压到目标目录
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    await zipEntries.forEach(entry => {
      if (entry.entryName.toLowerCase().endsWith('.md')) {
        // 获取文件内容为 Buffer
        const content = zip.readFile(entry);
        // 尝试用 UTF-8 解码，如果失败则尝试其他编码
        const text = content.toString('utf8');
        // 创建输出文件路径
        const outputPath = path.join(targetDir, fileName.replace('.pdf', '.md'));
        // 写入文件，确保使用 UTF-8 编码
        fs.writeFileSync(outputPath, text, { encoding: 'utf8' });
        console.log(`解压完成到目录: ${outputPath}`);
      }
    });
  }
  /**
   * 发送 HTTP 请求
   * @private
   */
  _makeHttpRequest(url, options) {
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
              reject(new Error(`请求失败，状态码: ${res.statusCode}, 响应: ${data}`));
            }
          } catch (error) {
            reject(new Error('响应解析失败'));
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
   * @private
   */
  _uploadFile(filePath, uploadUrl) {
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
}

module.exports = MinerUStrategy;
