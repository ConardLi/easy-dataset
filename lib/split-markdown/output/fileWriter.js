/**
 * 文件输出模块
 */

const fs = require('fs');
const path = require('path');
const { ensureDirectoryExists } = require('../utils/common');

/**
 * 将分割结果保存到单独的文件
 * @param {Array} splitResult - 分割结果数组
 * @param {string} baseFilename - 基础文件名（不包含扩展名）
 * @param {Function} callback - 回调函数
 */
function saveToSeparateFiles(splitResult, baseFilename, callback) {
  // 获取基础目录和文件名（无扩展名）
  const basePath = path.dirname(baseFilename);
  const filenameWithoutExt = path.basename(baseFilename).replace(/\.[^/.]+$/, '');

  // 创建用于存放分割文件的目录
  const outputDir = path.join(basePath, `${filenameWithoutExt}_parts`);

  // 确保目录存在
  ensureDirectoryExists(outputDir);

  // 递归保存文件
  function saveFile(index) {
    if (index >= splitResult.length) {
      // 所有文件保存完成
      callback(null, outputDir, splitResult.length);
      return;
    }

    const part = splitResult[index];
    const paddedIndex = String(index + 1).padStart(3, '0'); // 确保文件排序正确
    const outputFile = path.join(outputDir, `${filenameWithoutExt}_part${paddedIndex}.md`);

    // 将摘要和内容格式化为Markdown
    const content = `> **📑 Summarization：** *${part.summary}*\n\n---\n\n${part.content}`;

    fs.writeFile(outputFile, content, 'utf8', err => {
      if (err) {
        callback(err);
        return;
      }

      // 继续保存下一个文件
      saveFile(index + 1);
    });
  }

  // 开始保存文件
  saveFile(0);
}

module.exports = {
  saveToSeparateFiles
};
