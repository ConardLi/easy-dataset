const http = require('http');
const path = require('path');
const fs = require('fs');
const { dialog } = require('electron');

/**
 * 检查端口是否被占用
 * @param {number} port 端口号
 * @returns {Promise<boolean>} 端口是否被占用
 */
function checkPort(port) {
  return new Promise(resolve => {
    const server = http.createServer();
    server.once('error', () => {
      resolve(true); // 端口被占用
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // 端口未被占用
    });
    server.listen(port);
  });
}

/**
 * 启动 Next.js 服务
 * @param {number} port 端口号
 * @param {Object} app Electron app 对象
 * @returns {Promise<string>} 服务URL
 */
async function startNextServer(port, app) {
  console.log(`GKGAI Dataset Generation 客户端启动中，当前版本: ${require('../util').getAppVersion()}`);

  // 设置日志文件路径
  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, `nextjs-${new Date().toISOString().replace(/:/g, '-')}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  // 重定向 console.log 和 console.error
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = function () {
    const args = Array.from(arguments);
    const logMessage = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');

    logStream.write(`[${new Date().toISOString()}] [LOG] ${logMessage}\n`);
    originalConsoleLog.apply(console, args);
  };

  console.error = function () {
    const args = Array.from(arguments);
    const logMessage = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');

    logStream.write(`[${new Date().toISOString()}] [ERROR] ${logMessage}\n`);
    originalConsoleError.apply(console, args);
  };

  // 检查端口是否被占用
  const isPortBusy = await checkPort(port);
  if (isPortBusy) {
    console.log(`端口 ${port} 已被占用，尝试直接连接...`);
    return `http://localhost:${port}`;
  }

  console.log(`启动 Next.js 服务，端口: ${port}`);

  try {
    // 动态导入 Next.js
    const next = require('next');
    const nextApp = next({
      dev: false,
      dir: path.join(__dirname, '../..'),
      conf: {
        // 配置 Next.js 的日志输出
        onInfo: info => {
          console.log(`[Next.js Info] ${info}`);
        },
        onError: error => {
          console.error(`[Next.js Error] ${error}`);
        },
        onWarn: warn => {
          console.log(`[Next.js Warning] ${warn}`);
        }
      }
    });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    const server = http.createServer((req, res) => {
      // 记录请求日志
      console.log(`[Request] ${req.method} ${req.url}`);
      handle(req, res);
    });

    return new Promise(resolve => {
      server.listen(port, err => {
        if (err) throw err;
        console.log(`服务已启动，正在打开应用...`);
        resolve(`http://localhost:${port}`);
      });
    });
  } catch (error) {
    console.error('启动服务失败:', error);
    dialog.showErrorBox('启动失败', `无法启动 Next.js 服务: ${error.message}`);
    app.quit();
    return '';
  }
}

module.exports = {
  checkPort,
  startNextServer
};
