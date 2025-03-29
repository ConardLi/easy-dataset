const { contextBridge, ipcRenderer } = require('electron');

// 在渲染进程中暴露安全的 API
contextBridge.exposeInMainWorld('electron', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 获取当前语言
  getLanguage: () => {
    // 尝试从本地存储获取语言设置
    const storedLang = localStorage.getItem('i18nextLng');
    // 如果存在则返回，否则返回系统语言或默认为中文
    return storedLang || navigator.language.startsWith('zh') ? 'zh' : 'en';
  },

  // 获取用户数据目录
  getUserDataPath: () => {
    try {
      return ipcRenderer.sendSync('get-user-data-path');
    } catch (error) {
      console.error('获取用户数据目录失败:', error);
      return null;
    }
  },

  // 更新相关 API
  updater: {
    // 检查更新
    checkForUpdates: () => ipcRenderer.invoke('check-update'),

    // 下载更新
    downloadUpdate: () => ipcRenderer.invoke('download-update'),

    // 安装更新
    installUpdate: () => ipcRenderer.invoke('install-update'),

    // 监听更新事件
    onUpdateAvailable: (callback) => {
      const handler = (_, info) => callback(info);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
    },

    onUpdateNotAvailable: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('update-not-available', handler);
      return () => ipcRenderer.removeListener('update-not-available', handler);
    },

    onUpdateError: (callback) => {
      const handler = (_, error) => callback(error);
      ipcRenderer.on('update-error', handler);
      return () => ipcRenderer.removeListener('update-error', handler);
    },

    onDownloadProgress: (callback) => {
      const handler = (_, progress) => callback(progress);
      ipcRenderer.on('download-progress', handler);
      return () => ipcRenderer.removeListener('download-progress', handler);
    },

    onUpdateDownloaded: (callback) => {
      const handler = (_, info) => callback(info);
      ipcRenderer.on('update-downloaded', handler);
      return () => ipcRenderer.removeListener('update-downloaded', handler);
    }
  }
});

// 通知渲染进程 preload 脚本已加载完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload script loaded');
});
