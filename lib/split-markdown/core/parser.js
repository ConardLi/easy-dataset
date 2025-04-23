/**
 * Markdown文档解析模块
 */

/**
 * 提取文档大纲
 * @param {string} text - Markdown文本
 * @returns {Array} - 提取的大纲数组
 */
function extractOutline(text) {
  const outlineRegex = /^(#{1,6})\s+(.+?)(?:\s*\{#[\w-]+\})?\s*$/gm;
  const outline = [];
  let match;

  while ((match = outlineRegex.exec(text)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();

    outline.push({
      level,
      title,
      position: match.index
    });
  }

  return outline;
}

/**
 * 根据标题分割文档
 * @param {string} text - Markdown文本
 * @param {Array} outline - 文档大纲
 * @returns {Array} - 按标题分割的段落数组
 */
function splitByHeadings(text, outline) {
  if (outline.length === 0) {
    return [
      {
        heading: null,
        level: 0,
        content: text,
        position: 0
      }
    ];
  }

  const sections = [];

  // 添加第一个标题前的内容（如果有）
  if (outline[0].position > 0) {
    const frontMatter = text.substring(0, outline[0].position).trim();
    if (frontMatter.length > 0) {
      sections.push({
        heading: null,
        level: 0,
        content: frontMatter,
        position: 0
      });
    }
  }

  // 分割每个标题的内容
  for (let i = 0; i < outline.length; i++) {
    const current = outline[i];
    const next = i < outline.length - 1 ? outline[i + 1] : null;

    const headingLine = text.substring(current.position).split('\n')[0];
    const startPos = current.position + headingLine.length + 1;
    const endPos = next ? next.position : text.length;

    let content = text.substring(startPos, endPos).trim();

    sections.push({
      heading: current.title,
      level: current.level,
      content: content,
      position: current.position
    });
  }

  return sections;
}

module.exports = {
  extractOutline,
  splitByHeadings
};
