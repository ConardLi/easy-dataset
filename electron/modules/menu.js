const { Menu, dialog, shell, app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getAppVersion } = require('../util');

/**
 * 创建应用菜单
 * @param {BrowserWindow} mainWindow 主窗口
 * @param {Function} clearCache 清除缓存函数
 */
function createMenu(mainWindow, clearCache) {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit', label: 'Quit' }]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Refresh' },
        { type: 'separator' },
        { role: 'resetzoom', label: 'Reset Zoom' },
        { role: 'zoomin', label: 'Zoom In' },
        { role: 'zoomout', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Fullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About HKGAI Dataset Generation',
              message: `HKGAI Dataset Generation v${getAppVersion()}`,
              detail: 'An application for creating fine-tuning datasets for large models.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Visit GitHub',
          click: () => {
            shell.openExternal('https://github.com/ConardLi/dataset');
          }
        }
      ]
    },
    {
      label: 'More',
      submenu: [
        { role: 'toggledevtools', label: 'Developer Tools' },
        {
          label: 'Open Logs Directory',
          click: () => {
            const logsDir = path.join(app.getPath('userData'), 'logs');
            if (!fs.existsSync(logsDir)) {
              fs.mkdirSync(logsDir, { recursive: true });
            }
            shell.openPath(logsDir);
          }
        },
        {
          label: 'Open Data Directory',
          click: () => {
            const dataDir = path.join(app.getPath('userData'), 'local-db');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }
            shell.openPath(dataDir);
          }
        },
        {
          label: 'Open Data Directory (History)',
          click: () => {
            const dataDir = path.join(os.homedir(), '.dataset-db');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }
            shell.openPath(dataDir);
          }
        },
        {
          label: 'Clear Cache',
          click: async () => {
            try {
              const response = await dialog.showMessageBox(mainWindow, {
                type: 'question',
                buttons: ['Cancel', 'Confirm'],
                defaultId: 1,
                title: 'Clear Cache',
                message: 'Are you sure you want to clear the cache?',
                detail:
                  'This will delete all files in the logs directory and local database cache files (excluding main database files).'
              });

              if (response.response === 1) {
                // User clicked confirm
                await clearCache();
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Cleared Successfully',
                  message: 'Cache has been cleared successfully'
                });
              }
            } catch (error) {
              global.appLog(`Failed to clear cache: ${error.message}`, 'error');
              dialog.showErrorBox('Failed to clear cache', error.message);
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = {
  createMenu
};
