/**
 * 输出格式化模块
 */

/**
 * 将分割后的文本重新组合成Markdown文档
 * @param {Array} splitResult - 分割结果数组
 * @returns {string} - 组合后的Markdown文档
 */
function combineMarkdown(splitResult) {
  let result = '';

  for (let i = 0; i < splitResult.length; i++) {
    const part = splitResult[i];

    // 添加分隔线和摘要
    if (i > 0) {
      result += '\n\n---\n\n';
    }

    result += `> **📑 Summarization：** *${part.summary}*\n\n---\n\n${part.content}`;
  }

  return result;
}

module.exports = {
  combineMarkdown
};
