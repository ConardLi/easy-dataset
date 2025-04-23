/**
 * Markdown文本分割工具主模块
 */

const parser = require('./core/parser');
const splitter = require('./core/splitter');
const summary = require('./core/summary');
const formatter = require('./output/formatter');
const fileWriter = require('./output/fileWriter');
const toc = require('./core/toc');

/**
 * 拆分Markdown文档
 * @param {string} markdownText - Markdown文本
 * @param {number} minSplitLength - 最小分割字数
 * @param {number} maxSplitLength - 最大分割字数
 * @returns {Array} - 分割结果数组
 */
function splitMarkdown(markdownText, minSplitLength, maxSplitLength) {
  // 解析文档结构
  const outline = parser.extractOutline(markdownText);

  // 按标题分割文档
  const sections = parser.splitByHeadings(markdownText, outline);

  // 处理段落，确保满足分割条件
  const res = splitter.processSections(sections, outline, minSplitLength, maxSplitLength);

  return res.map(r => ({
    result: `> **📑 Summarization：** *${r.summary}*\n\n---\n\n${r.content}`,
    ...r
  }));
}

// 导出模块功能
module.exports = {
  // 核心功能
  splitMarkdown,
  combineMarkdown: formatter.combineMarkdown,
  saveToSeparateFiles: fileWriter.saveToSeparateFiles,

  // 目录提取功能
  extractTableOfContents: toc.extractTableOfContents,
  tocToMarkdown: toc.tocToMarkdown,

  // 其他导出的子功能
  parser,
  splitter,
  summary,
  formatter,
  fileWriter,
  toc
};
