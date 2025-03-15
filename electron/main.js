const { app, BrowserWindow, dialog, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');
const fs = require('fs');

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
const port = 3000;
let mainWindow;
let nextApp;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // 设置窗口标题
  mainWindow.setTitle(`Easy Dataset v${getAppVersion()}`);

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

// 设置 IPC 处理程序
ipcMain.on('get-user-data-path', (event) => {
  event.returnValue = app.getPath('userData');
});

// 当 Electron 完成初始化时创建窗口
app.whenReady().then(createWindow);

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
