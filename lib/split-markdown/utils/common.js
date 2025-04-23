/**
 * 通用工具函数模块
 */

const fs = require('fs');
const path = require('path');

/**
 * 检查并创建目录
 * @param {string} directory - 目录路径
 */
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

/**
 * 从文件路径获取不带扩展名的文件名
 * @param {string} filePath - 文件路径
 * @returns {string} - 不带扩展名的文件名
 */
function getFilenameWithoutExt(filePath) {
  return path.basename(filePath).replace(/\.[^/.]+$/, '');
}

module.exports = {
  ensureDirectoryExists,
  getFilenameWithoutExt
};
