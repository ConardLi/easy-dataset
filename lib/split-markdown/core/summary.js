/**
 * 摘要生成模块
 */

/**
 * 生成段落增强摘要，包含该段落中的所有标题
 * @param {Object} section - 段落对象
 * @param {Array} outline - 目录大纲
 * @param {number} partIndex - 子段落索引（可选）
 * @param {number} totalParts - 子段落总数（可选）
 * @returns {string} - 生成的增强摘要
 */
function generateEnhancedSummary(section, outline, partIndex = null, totalParts = null) {
  // 如果是文档前言
  if ((!section.heading && section.level === 0) || (!section.headings && !section.heading)) {
    // 获取文档标题（如果存在）
    const docTitle = outline.length > 0 && outline[0].level === 1 ? outline[0].title : '文档';
    return `${docTitle} 前言`;
  }

  // 如果有headings数组，使用它
  if (section.headings && section.headings.length > 0) {
    // 按照级别和位置排序标题
    const sortedHeadings = [...section.headings].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.position - b.position;
    });

    // 构建所有标题包含的摘要
    const headingsMap = new Map(); // 用于去重

    // 首先处理每个标题，找到其完整路径
    for (const heading of sortedHeadings) {
      // 跳过空标题
      if (!heading.heading) continue;

      // 查找当前标题在大纲中的位置
      const headingIndex = outline.findIndex(item => item.title === heading.heading && item.level === heading.level);

      if (headingIndex === -1) {
        // 如果在大纲中找不到，直接使用当前标题
        headingsMap.set(heading.heading, heading.heading);
        continue;
      }

      // 查找所有上级标题
      const pathParts = [];
      let parentLevel = heading.level - 1;

      for (let i = headingIndex - 1; i >= 0 && parentLevel > 0; i--) {
        if (outline[i].level === parentLevel) {
          pathParts.unshift(outline[i].title);
          parentLevel--;
        }
      }

      // 添加当前标题
      pathParts.push(heading.heading);

      // 生成完整路径并存储到Map中
      const fullPath = pathParts.join(' > ');
      headingsMap.set(fullPath, fullPath);
    }

    // 将所有标题路径转换为数组并按间隔符数量排序（表示层级深度）
    const paths = Array.from(headingsMap.values()).sort((a, b) => {
      const aDepth = (a.match(/>/g) || []).length;
      const bDepth = (b.match(/>/g) || []).length;
      return aDepth - bDepth || a.localeCompare(b);
    });

    // 如果没有有效的标题，返回默认摘要
    if (paths.length === 0) {
      return section.heading ? section.heading : '未命名段落';
    }

    // 如果是单个标题，直接返回
    if (paths.length === 1) {
      let summary = paths[0];
      // 如果是分段的部分，添加Part信息
      if (partIndex !== null && totalParts > 1) {
        summary += ` - Part ${partIndex}/${totalParts}`;
      }
      return summary;
    }

    // 如果有多个标题，生成多标题摘要
    let summary = '';

    // 尝试找到公共前缀
    const firstPath = paths[0];
    const segments = firstPath.split(' > ');

    for (let i = 0; i < segments.length - 1; i++) {
      const prefix = segments.slice(0, i + 1).join(' > ');
      let isCommonPrefix = true;

      for (let j = 1; j < paths.length; j++) {
        if (!paths[j].startsWith(prefix + ' > ')) {
          isCommonPrefix = false;
          break;
        }
      }

      if (isCommonPrefix) {
        summary = prefix + ' > [';
        // 添加非公共部分
        for (let j = 0; j < paths.length; j++) {
          const uniquePart = paths[j].substring(prefix.length + 3); // +3 为 ' > ' 的长度
          summary += (j > 0 ? ', ' : '') + uniquePart;
        }
        summary += ']';
        break;
      }
    }

    // 如果没有公共前缀，使用完整列表
    if (!summary) {
      summary = paths.join(', ');
    }

    // 如果是分段的部分，添加Part信息
    if (partIndex !== null && totalParts > 1) {
      summary += ` - Part ${partIndex}/${totalParts}`;
    }

    return summary;
  }

  // 兼容旧逻辑，当没有headings数组时
  if (!section.heading && section.level === 0) {
    return '文档前言';
  }

  // 查找当前段落在大纲中的位置
  const currentHeadingIndex = outline.findIndex(item => item.title === section.heading && item.level === section.level);

  if (currentHeadingIndex === -1) {
    return section.heading ? section.heading : '未命名段落';
  }

  // 查找所有上级标题
  const parentHeadings = [];
  let parentLevel = section.level - 1;

  for (let i = currentHeadingIndex - 1; i >= 0 && parentLevel > 0; i--) {
    if (outline[i].level === parentLevel) {
      parentHeadings.unshift(outline[i].title);
      parentLevel--;
    }
  }

  // 构建摘要
  let summary = '';

  if (parentHeadings.length > 0) {
    summary = parentHeadings.join(' > ') + ' > ';
  }

  summary += section.heading;

  // 如果是分段的部分，添加Part信息
  if (partIndex !== null && totalParts > 1) {
    summary += ` - Part ${partIndex}/${totalParts}`;
  }

  return summary;
}

/**
 * 旧的摘要生成函数，保留供兼容性使用
 * @param {Object} section - 段落对象
 * @param {Array} outline - 目录大纲
 * @param {number} partIndex - 子段落索引（可选）
 * @param {number} totalParts - 子段落总数（可选）
 * @returns {string} - 生成的摘要
 */
function generateSummary(section, outline, partIndex = null, totalParts = null) {
  return generateEnhancedSummary(section, outline, partIndex, totalParts);
}

module.exports = {
  generateEnhancedSummary,
  generateSummary
};
