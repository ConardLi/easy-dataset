/**
 * 原子块检测与保护模块
 *
 * 核心思路：在分割前将不可拆分的 Markdown 结构元素（表格、公式、代码块、列表）
 * 替换为单行占位符，分割完成后还原。
 * 这样分割引擎无需了解这些特殊语法，占位符不会被段落分割切断。
 */

const PLACEHOLDER_PREFIX = '\x00ATOM_';
const PLACEHOLDER_SUFFIX = '\x00';

/**
 * 构造占位符字符串
 * @param {number} index
 * @returns {string}
 */
function makePlaceholder(index) {
  return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
}

/**
 * 检测围栏代码块 ```...``` 或 ~~~...~~~
 * @param {string} text
 * @returns {Array<{type: string, start: number, end: number}>}
 */
function detectFencedCodeBlocks(text) {
  const blocks = [];
  const regex = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1\s*$/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      type: 'code',
      start: match.index,
      end: match.index + match[0].length
    });
  }
  // 上面的正则要求闭合标记与开头完全相同，对于不严格的围栏用贪心回退
  if (blocks.length === 0) {
    const simpleRegex = /^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1\s*$/gm;
    while ((match = simpleRegex.exec(text)) !== null) {
      blocks.push({
        type: 'code',
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }
  return blocks;
}

/**
 * 检测显示数学公式块 $$...$$
 * 使用状态扫描器而非单纯正则，以处理嵌套情况
 * @param {string} text
 * @returns {Array<{type: string, start: number, end: number}>}
 */
function detectDisplayMath(text) {
  const blocks = [];
  let i = 0;
  while (i < text.length - 1) {
    if (text[i] === '$' && text[i + 1] === '$') {
      const start = i;
      i += 2;
      // 寻找闭合 $$
      while (i < text.length - 1) {
        if (text[i] === '$' && text[i + 1] === '$') {
          blocks.push({
            type: 'math_display',
            start: start,
            end: i + 2
          });
          i += 2;
          break;
        }
        i++;
      }
    } else {
      i++;
    }
  }
  return blocks;
}

/**
 * 检测行内数学 $...$（不跨段落）
 * @param {string} text
 * @returns {Array<{type: string, start: number, end: number}>}
 */
function detectInlineMath(text) {
  const blocks = [];
  const regex = /\$([^\$\n]+?)\$/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // 排除 $$ （已被 detectDisplayMath 处理）
    if (match.index > 0 && text[match.index - 1] === '$') continue;
    if (match.index + match[0].length < text.length && text[match.index + match[0].length] === '$') continue;

    blocks.push({
      type: 'math_inline',
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return blocks;
}

/**
 * 检测 Markdown 表格
 * 匹配连续的 | 分隔行，包含表头行 + 分隔行 + 数据行
 * @param {string} text
 * @returns {Array<{type: string, start: number, end: number}>}
 */
function detectTables(text) {
  const blocks = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    // 检测表格起始：包含 | 的行
    if (isTableRow(line)) {
      const tableStart = getLineStart(lines, i);
      let tableEnd = i;

      // 向后扫描连续的表格行
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (isTableRow(nextLine) || isTableSeparator(nextLine)) {
          tableEnd = j;
          j++;
        } else if (nextLine === '') {
          // 表格后的空行不算表格的一部分，但检查后面是否还有表格行
          break;
        } else {
          break;
        }
      }

      // 确认是真正的表格（至少有分隔行）
      let hasSeparator = false;
      for (let k = i; k <= tableEnd; k++) {
        if (isTableSeparator(lines[k].trim())) {
          hasSeparator = true;
          break;
        }
      }

      if (hasSeparator && tableEnd > i) {
        const startOffset = getLineStart(lines, i);
        const endOffset = getLineEnd(lines, tableEnd);
        blocks.push({
          type: 'table',
          start: startOffset,
          end: endOffset
        });
        i = tableEnd + 1;
        continue;
      }
    }
    i++;
  }

  return blocks;
}

/**
 * 检测 HTML 表格 <table>...</table>
 * 支持单行 HTML 表格，避免按固定长度从标签中间切断。
 * @param {string} text
 * @returns {Array<{type: string, start: number, end: number}>}
 */
function detectHtmlTables(text) {
  const blocks = [];
  const openRegex = /<table\b[^>]*>/gi;
  let match;

  while ((match = openRegex.exec(text)) !== null) {
    const start = match.index;
    const closeRegex = /<\/table\s*>/gi;
    closeRegex.lastIndex = openRegex.lastIndex;
    const closeMatch = closeRegex.exec(text);
    if (!closeMatch) continue;

    blocks.push({
      type: 'html_table',
      start,
      end: closeMatch.index + closeMatch[0].length
    });
    openRegex.lastIndex = closeMatch.index + closeMatch[0].length;
  }

  return blocks;
}

/**
 * 判断是否为表格行（含 | 分隔的内容行）
 */
function isTableRow(line) {
  return line.includes('|') && !isTableSeparator(line) && line.length > 1;
}

/**
 * 判断是否为表格分隔行 ( |---|---|---| )
 */
function isTableSeparator(line) {
  return /^\|?[\s\-:|]+\|[\s\-:|]+\|?\s*$/.test(line);
}

/**
 * 检测有序/无序列表块
 * @param {string} text
 * @returns {Array<{type: string, start: number, end: number}>}
 */
function detectLists(text) {
  const blocks = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (isListItem(line)) {
      const listStartLine = i;
      let listEndLine = i;

      // 向后扫描连续的列表行（包括缩进的子项和空行间隔）
      let j = i + 1;
      let consecutiveEmptyLines = 0;
      while (j < lines.length) {
        const nextLine = lines[j];
        if (isListItem(nextLine) || isListContinuation(nextLine)) {
          listEndLine = j;
          consecutiveEmptyLines = 0;
          j++;
        } else if (nextLine.trim() === '') {
          consecutiveEmptyLines++;
          if (consecutiveEmptyLines >= 2) break; // 两个连续空行结束列表
          j++;
        } else {
          break;
        }
      }

      // 列表至少 2 个项目才作为原子块保护
      const itemCount = countListItems(lines, listStartLine, listEndLine);
      if (itemCount >= 2) {
        const startOffset = getLineStart(lines, listStartLine);
        const endOffset = getLineEnd(lines, listEndLine);
        blocks.push({
          type: 'list',
          start: startOffset,
          end: endOffset
        });
        i = listEndLine + 1;
        continue;
      }
    }
    i++;
  }

  return blocks;
}

/**
 * 判断是否为列表项
 */
function isListItem(line) {
  return /^(\s*)([-*+]|\d+\.)\s+/.test(line);
}

/**
 * 判断是否为列表续行（缩进的非列表行）
 */
function isListContinuation(line) {
  return /^\s{2,}\S/.test(line) && !isListItem(line);
}

/**
 * 计算列表项数量
 */
function countListItems(lines, start, end) {
  let count = 0;
  for (let i = start; i <= end; i++) {
    if (isListItem(lines[i])) count++;
  }
  return count;
}

/**
 * 获取第 lineIndex 行在原文中的起始偏移量
 */
function getLineStart(lines, lineIndex) {
  let offset = 0;
  for (let i = 0; i < lineIndex; i++) {
    offset += lines[i].length + 1; // +1 for \n
  }
  return offset;
}

/**
 * 获取第 lineIndex 行在原文中的结束偏移量
 */
function getLineEnd(lines, lineIndex) {
  let offset = 0;
  for (let i = 0; i <= lineIndex; i++) {
    offset += lines[i].length + 1;
  }
  return offset; // 指向行尾换行符之后
}

/**
 * 合并重叠的区间
 * @param {Array<{start: number, end: number}>} ranges - 已排序的区间数组
 * @returns {Array<{start: number, end: number}>}
 */
function mergeOverlapping(ranges) {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
      // 合并类型
      if (!last.types) last.types = [last.type];
      last.types.push(curr.type);
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

/**
 * 排除已被占用区间的检测结果
 * @param {Array} newBlocks - 新检测到的区间
 * @param {Array} occupied - 已占用的区间
 * @returns {Array} - 过滤后的新区间
 */
function excludeOccupied(newBlocks, occupied) {
  return newBlocks.filter(block => {
    return !occupied.some(occ =>
      (block.start >= occ.start && block.start < occ.end) ||
      (block.end > occ.start && block.end <= occ.end) ||
      (block.start <= occ.start && block.end >= occ.end)
    );
  });
}

/**
 * 为表格附带上下文（前后文）
 * @param {string} text - 原始文本
 * @param {Array} blocks - 原子块数组
 * @param {number} maxPrefixLen - 前文最大长度
 * @param {number} maxSuffixLen - 后文最大长度
 * @returns {Array} - 扩展后的原子块数组
 */
function expandTableContext(text, blocks, maxPrefixLen = 300, maxSuffixLen = 200) {
  return blocks.map(block => {
    if (block.type !== 'table') return block;

    let newStart = block.start;
    let newEnd = block.end;

    // 向前查找前文段落
    if (block.start > 0) {
      // 找到表格前最近的两个 \n\n 之间的段落
      const beforeStart = Math.max(0, block.start - maxPrefixLen);
      const beforeText = text.substring(beforeStart, block.start);
      const lastParaBreak = beforeText.lastIndexOf('\n\n');
      if (lastParaBreak >= 0) {
        const paragraphText = beforeText.substring(lastParaBreak + 2).trim();
        if (paragraphText.length > 0 && paragraphText.length <= maxPrefixLen) {
          // lastParaBreak 是 beforeText 的相对偏移，需要加上 beforeStart 得到绝对位置
          newStart = beforeStart + lastParaBreak + 2;
        }
      } else if (beforeText.trim().length > 0 && beforeText.trim().length <= maxPrefixLen) {
        // 没有段落分隔，整段前文都纳入
        newStart = beforeStart;
      }
    }

    // 向后查找后文段落
    if (block.end < text.length) {
      const afterText = text.substring(block.end, Math.min(text.length, block.end + maxSuffixLen));
      const nextParaBreak = afterText.indexOf('\n\n');
      if (nextParaBreak >= 0) {
        const paragraphText = afterText.substring(0, nextParaBreak).trim();
        if (paragraphText.length > 0 && paragraphText.length <= maxSuffixLen) {
          newEnd = block.end + nextParaBreak;
        }
      } else if (afterText.trim().length > 0 && afterText.trim().length <= maxSuffixLen) {
        newEnd = Math.min(text.length, block.end + maxSuffixLen);
      }
    }

    return { ...block, start: newStart, end: newEnd };
  });
}

/**
 * 检测并保护文本中的原子块
 * 按优先级顺序检测：围栏代码块 → 显示数学 → 表格 → 行内数学 → 列表
 * @param {string} text - 原始 Markdown 文本
 * @returns {{ protectedText: string, atomMap: Array<{type: string, content: string}> }}
 */
function detectAndProtect(text) {
  let occupied = [];

  // 1. 围栏代码块（最高优先级）
  const codeBlocks = detectFencedCodeBlocks(text);
  occupied = occupied.concat(codeBlocks);

  // 2. 显示数学公式
  let mathBlocks = detectDisplayMath(text);
  mathBlocks = excludeOccupied(mathBlocks, occupied);
  occupied = occupied.concat(mathBlocks);

  // 3. 表格（带上下文扩展）
  let tableBlocks = detectTables(text);
  tableBlocks = excludeOccupied(tableBlocks, occupied);
  tableBlocks = expandTableContext(text, tableBlocks);
  // 扩展后重新排除重叠
  tableBlocks = excludeOccupied(tableBlocks, occupied);
  occupied = occupied.concat(tableBlocks);

  // 4. HTML 表格（不扩展上下文，避免吞入过多正文）
  let htmlTableBlocks = detectHtmlTables(text);
  htmlTableBlocks = excludeOccupied(htmlTableBlocks, occupied);
  occupied = occupied.concat(htmlTableBlocks);

  // 5. 行内数学
  let inlineMathBlocks = detectInlineMath(text);
  inlineMathBlocks = excludeOccupied(inlineMathBlocks, occupied);
  // 行内数学不作为原子块保护（太小了），仅影响句子分割
  // 暂不加入 occupied

  // 6. 列表
  let listBlocks = detectLists(text);
  listBlocks = excludeOccupied(listBlocks, occupied);
  occupied = occupied.concat(listBlocks);

  // 合并所有要保护的区间（不含行内数学），按 start 排序
  const allBlocks = mergeOverlapping([...codeBlocks, ...mathBlocks, ...tableBlocks, ...htmlTableBlocks, ...listBlocks]);
  allBlocks.sort((a, b) => a.start - b.start);

  // 构建 atomMap：索引 i 对应 ATOM_i 占位符
  const finalAtomMap = [];
  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    finalAtomMap.push({
      type: block.type || 'unknown',
      content: text.substring(block.start, block.end)
    });
  }

  // 从后向前替换原文（避免偏移量变化）
  let protectedText = text;
  for (let i = allBlocks.length - 1; i >= 0; i--) {
    const block = allBlocks[i];
    const placeholder = makePlaceholder(i);
    protectedText = protectedText.substring(0, block.start) + placeholder + protectedText.substring(block.end);
  }

  return {
    protectedText,
    atomMap: finalAtomMap
  };
}

/**
 * 将占位符还原为原始内容
 * @param {string} protectedText - 含占位符的文本
 * @param {Array<{type: string, content: string}>} atomMap - 原子块映射
 * @returns {string} - 还原后的文本
 */
function restore(protectedText, atomMap) {
  let text = protectedText;
  for (let i = 0; i < atomMap.length; i++) {
    const placeholder = makePlaceholder(i);
    // 转义替换字符串中的 $ 特殊字符（$$ → $, $& → 匹配等）
    const escapedContent = atomMap[i].content.replace(/\$/g, '$$$$');
    text = text.replace(placeholder, escapedContent);
  }
  return text;
}

/**
 * 检查文本是否包含占位符
 * @param {string} text
 * @returns {boolean}
 */
function containsPlaceholder(text) {
  return text.includes(PLACEHOLDER_PREFIX);
}

/**
 * 获取占位符正则（用于外部模块检测）
 * @returns {RegExp}
 */
function getPlaceholderRegex() {
  return /\x00ATOM_(\d+)\x00/g;
}

module.exports = {
  detectAndProtect,
  restore,
  containsPlaceholder,
  getPlaceholderRegex,
  makePlaceholder,
  PLACEHOLDER_PREFIX,
  PLACEHOLDER_SUFFIX
};
