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
  }
});

// 通知渲染进程 preload 脚本已加载完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload 脚本已加载');
});
