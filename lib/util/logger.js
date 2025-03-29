// lib/utils/logger.js
const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;

function log(level, ...args) {
  const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');

  if (isElectron) {
    // 在 Electron 环境下，将日志写入文件
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('log', { level, message });
  } else {
    // 在非 Electron 环境下，只输出到控制台
    console[level](...args);
  }
}

export default {
  info: (...args) => log('info', ...args),
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  debug: (...args) => log('debug', ...args)
};
