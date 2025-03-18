const { app, BrowserWindow, dialog, Menu, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');
const fs = require('fs');
const url = require('url');

// 获取应用版本
const getAppVersion = () => {
  try {
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    }
    return '1.0.0';
  } catch (error) {
    console.error('读取版本信息失败:', error);
    return '1.0.0';
  }
};

// 检查端口是否被占用
const checkPort = (port) => {
  return new Promise((resolve) => {
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
};

// 是否是开发环境
const isDev = process.env.NODE_ENV === 'development';
const port = 1717;
let mainWindow;
let nextApp;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/imgs/logo.ico')
  });

  // 设置窗口标题
  mainWindow.setTitle(`Easy Dataset v${getAppVersion()}`);
  const loadingPath = url.format({
    pathname: path.join(__dirname, 'loading.html'),
    protocol: 'file:',
    slashes: true
  });
  // 加载 loading 页面时使用专门的 preload 脚本
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(loadingPath);

  // 在开发环境中加载 localhost URL
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    // 在生产环境中启动 Next.js 服务
    startNextServer().then((url) => {
      mainWindow.loadURL(url);
    });
  }

  // 处理窗口导航事件，将外部链接在浏览器中打开
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    // 解析当前 URL 和导航 URL
    const parsedUrl = new URL(navigationUrl);
    const currentHostname = isDev ? 'localhost' : 'localhost';
    const currentPort = port.toString();

    // 检查是否是外部链接
    if (parsedUrl.hostname !== currentHostname || 
        (parsedUrl.port !== currentPort && parsedUrl.port !== '')) {
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
    if (parsedUrl.hostname !== currentHostname || 
        (parsedUrl.port !== currentPort && parsedUrl.port !== '')) {
      shell.openExternal(navigationUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // 创建菜单
  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggledevtools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetzoom', label: '重置缩放' },
        { role: 'zoomin', label: '放大' },
        { role: 'zoomout', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: '关于 Easy Dataset',
              message: `Easy Dataset v${getAppVersion()}`,
              detail: '一个用于创建大模型微调数据集的应用程序。',
              buttons: ['确定']
            });
          }
        },
        {
          label: '访问 GitHub',
          click: () => {
            shell.openExternal('https://github.com/ConardLi/easy-dataset');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 启动 Next.js 服务
async function startNextServer() {
  console.log(`Easy Dataset 客户端启动中，当前版本: ${getAppVersion()}`);

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
    nextApp = next({ dev: false, dir: path.join(__dirname, '..') });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    return new Promise((resolve) => {
      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`服务已启动，正在打开应用...`);
        resolve(`http://localhost:${port}`);
      });
    });
  } catch (error) {
    console.error('启动服务失败:', error);
    dialog.showErrorBox(
      '启动失败',
      `无法启动 Next.js 服务: ${error.message}`
    );
    app.quit();
    return '';
  }
}

// 自动更新配置
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.allowDowngrade = false;


  // 检查更新时出错
  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('更新错误', `检查更新时出错: ${error.message}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', error.message);
    }
  });

  // 检查到更新时
  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      });
    }
  });

  // 没有可用更新
  autoUpdater.on('update-not-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available');
    }
  });

  // 下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  // 下载完成
  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      });
    }
  });
}

// 设置 IPC 处理程序
ipcMain.on('get-user-data-path', (event) => {
  event.returnValue = app.getPath('userData');
});

// 检查更新
ipcMain.handle('check-update', async () => {
  try {
    if (isDev) {
      // 开发环境下模拟更新检查
      return {
        hasUpdate: false,
        currentVersion: getAppVersion(),
        message: '开发环境下不检查更新'
      };
    }

    // 返回当前版本信息，并开始检查更新
    const result = await autoUpdater.checkForUpdates();
    return {
      checking: true,
      currentVersion: getAppVersion()
    };
  } catch (error) {
    console.error('检查更新失败:', error);
    return {
      hasUpdate: false,
      currentVersion: getAppVersion(),
      error: error.message
    };
  }
});

// 下载更新
ipcMain.handle('download-update', async () => {
  try {
    autoUpdater.downloadUpdate();
    return { downloading: true };
  } catch (error) {
    console.error('下载更新失败:', error);
    return { error: error.message };
  }
});

// 安装更新
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
  return { installing: true };
});

// 当 Electron 完成初始化时创建窗口
app.whenReady().then(() => {
  createWindow();
  // 设置自动更新
  setupAutoUpdater();

  // 应用启动完成后的一段时间后自动检查更新
  setTimeout(() => {
    if (!isDev) {
      autoUpdater.checkForUpdates().catch(err => {
        console.error('自动检查更新失败:', err);
      });
    }
  }, 10000); // 10秒后检查更新
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  if (nextApp) {
    console.log('正在关闭 Next.js 服务...');
    // 这里可以添加清理 Next.js 服务的代码
  }
});