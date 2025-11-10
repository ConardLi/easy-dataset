const { BrowserWindow, shell } = require('electron');
const path = require('path');
const url = require('url');
const { getAppVersion } = require('../util');

let mainWindow;

/**
 * 创建主窗口
 * @param {boolean} isDev 是否为开发环境
 * @param {number} port 服务端口
 * @returns {BrowserWindow} 创建的主窗口
 */
function createWindow(isDev, port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js')
    },
    icon: path.join(__dirname, '../../public/imgs/logo.ico')
  });

  // 设置窗口标题
  mainWindow.setTitle(`HKGAI Dataset Generation v${getAppVersion()}`);
  const loadingPath = url.format({
    pathname: path.join(__dirname, '..', 'loading.html'),
    protocol: 'file:',
    slashes: true
  });

  // 加载 loading 页面时使用专门的 preload 脚本
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(loadingPath);

  // 处理窗口导航事件，将外部链接在浏览器中打开
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    // 解析当前 URL 和导航 URL
    const parsedUrl = new URL(navigationUrl);
    const currentHostname = isDev ? 'localhost' : 'localhost';
    const currentPort = port.toString();

    // 检查是否是外部链接
    if (parsedUrl.hostname !== currentHostname || (parsedUrl.port !== currentPort && parsedUrl.port !== '')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // 处理新窗口打开请求，将外部链接在浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url: navigationUrl }) => {
    // 解析导航 URL
    const parsedUrl = new URL(navigationUrl);
    const currentHostname = isDev ? 'localhost' : 'localhost';
    const currentPort = port.toString();

    // 检查是否是外部链接
    if (parsedUrl.hostname !== currentHostname || (parsedUrl.port !== currentPort && parsedUrl.port !== '')) {
      shell.openExternal(navigationUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.maximize();

  return mainWindow;
}

/**
 * 加载应用URL
 * @param {string} appUrl 应用URL
 */
function loadAppUrl(appUrl) {
  if (mainWindow) {
    mainWindow.loadURL(appUrl);
  }
}

/**
 * 在开发环境中打开开发者工具
 */
function openDevTools() {
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * 获取主窗口
 * @returns {BrowserWindow} 主窗口
 */
function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createWindow,
  loadAppUrl,
  openDevTools,
  getMainWindow
};
