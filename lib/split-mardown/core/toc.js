/**
 * Markdown目录提取模块
 */

/**
 * 提取Markdown文档的目录结构
 * @param {string} text - Markdown文本
 * @param {Object} options - 配置选项
 * @param {number} options.maxLevel - 提取的最大标题级别，默认为6
 * @param {boolean} options.includeLinks - 是否包含锚点链接，默认为true
 * @param {boolean} options.flatList - 是否返回扁平列表，默认为false（返回嵌套结构）
 * @returns {Array} - 目录结构数组
 */
function extractTableOfContents(text, options = {}) {
  const { maxLevel = 6, includeLinks = true, flatList = false } = options;

  // 匹配标题的正则表达式
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\s*\{#[\w-]+\})?\s*$/gm;
  const tocItems = [];
  let match;

  while ((match = headingRegex.exec(text)) !== null) {
    const level = match[1].length;

    // 如果标题级别超过了设定的最大级别，则跳过
    if (level > maxLevel) {
      continue;
    }

    const title = match[2].trim();
    const position = match.index;

    // 生成锚点ID（用于链接）
    const anchorId = generateAnchorId(title);

    tocItems.push({
      level,
      title,
      position,
      anchorId,
      children: []
    });
  }

  // 如果需要返回扁平列表，直接返回处理后的结果
  if (flatList) {
    return tocItems.map(item => {
      const result = {
        level: item.level,
        title: item.title,
        position: item.position
      };

      if (includeLinks) {
        result.link = `#${item.anchorId}`;
      }

      return result;
    });
  }

  // 构建嵌套结构
  return buildNestedToc(tocItems, includeLinks);
}

/**
 * 生成标题的锚点ID
 * @param {string} title - 标题文本
 * @returns {string} - 生成的锚点ID
 */
function generateAnchorId(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}

/**
 * 构建嵌套的目录结构
 * @param {Array} items - 扁平的目录项数组
 * @param {boolean} includeLinks - 是否包含链接
 * @returns {Array} - 嵌套的目录结构
 */
function buildNestedToc(items, includeLinks) {
  const result = [];
  const stack = [{ level: 0, children: result }];

  items.forEach(item => {
    const tocItem = {
      title: item.title,
      level: item.level,
      position: item.position,
      children: []
    };

    if (includeLinks) {
      tocItem.link = `#${item.anchorId}`;
    }

    // 找到当前项的父级
    while (stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    // 将当前项添加到父级的children中
    stack[stack.length - 1].children.push(tocItem);

    // 将当前项入栈
    stack.push(tocItem);
  });

  return result;
}

/**
 * 将目录结构转换为Markdown格式
 * @param {Array} toc - 目录结构（嵌套或扁平）
 * @param {Object} options - 配置选项
 * @param {boolean} options.isNested - 是否为嵌套结构，默认为true
 * @param {boolean} options.includeLinks - 是否包含链接，默认为true
 * @returns {string} - Markdown格式的目录
 */
function tocToMarkdown(toc, options = {}) {
  const { isNested = true, includeLinks = true } = options;

  if (isNested) {
    return nestedTocToMarkdown(toc, 0, includeLinks);
  } else {
    return flatTocToMarkdown(toc, includeLinks);
  }
}

/**
 * 将嵌套的目录结构转换为Markdown格式
 * @private
 */
function nestedTocToMarkdown(items, indent = 0, includeLinks) {
  let result = '';
  const indentStr = '  '.repeat(indent);

  // 添加数据验证
  if (!Array.isArray(items)) {
    console.warn('Warning: items is not an array in nestedTocToMarkdown');
    return result;
  }

  items.forEach(item => {
    const titleText = includeLinks && item.link ? `[${item.title}](${item.link})` : item.title;

    result += `${indentStr}- ${titleText}\n`;

    if (item.children && item.children.length > 0) {
      result += nestedTocToMarkdown(item.children, indent + 1, includeLinks);
    }
  });

  return result;
}

/**
 * 将扁平的目录结构转换为Markdown格式
 * @private
 */
function flatTocToMarkdown(items, includeLinks) {
  let result = '';

  items.forEach(item => {
    const indent = '  '.repeat(item.level - 1);
    const titleText = includeLinks && item.link ? `[${item.title}](${item.link})` : item.title;

    result += `${indent}- ${titleText}\n`;
  });

  return result;
}

module.exports = {
  extractTableOfContents,
  tocToMarkdown
};
