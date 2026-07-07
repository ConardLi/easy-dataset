/**
 * 核心分块引擎
 *
 * 替代现有 splitter.processSections()，修复累积逻辑缺陷：
 * - 不产生空块
 * - 不切断占位符（原子块）
 * - 长段拆分时保留标题上下文
 * - 更稳健的小段合并策略
 */

const { splitSentences } = require('./sentence-splitter');
const { containsPlaceholder } = require('./atomics');

/**
 * 构建段落完整文本（标题行 + 内容）
 * @param {Object} section - 段落对象 {heading, level, content}
 * @returns {string}
 */
function buildSectionText(section) {
  if (section.heading) {
    return `${'#'.repeat(section.level)} ${section.heading}\n${section.content}`;
  }
  return section.content;
}

/**
 * 将超长内容分割为不超过 maxLength 的块
 * 尊重占位符（原子块），不从中间切断
 * @param {string} content - 文本内容（可能含占位符）
 * @param {number} maxLength - 最大分块长度
 * @returns {string[]} - 分块后的文本数组
 */
function splitLongContent(content, maxLength) {
  if (content.length <= maxLength) return [content];

  const result = [];
  // 1. 先按段落分割（\n\n）
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const candidate = currentChunk.length > 0 ? currentChunk + '\n\n' + para : para;

    if (candidate.length <= maxLength) {
      currentChunk = candidate;
    } else {
      // 当前块不为空，先输出
      if (currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = '';
      }

      // 处理超长段落
      if (para.length <= maxLength) {
        currentChunk = para;
      } else if (containsPlaceholder(para)) {
        // 段落含占位符（原子块），不能再分割，直接作为一块
        result.push(para);
      } else {
        // 用句子分割进一步拆分
        const subChunks = splitBySmartSentences(para, maxLength);
        // 前 n-1 块直接输出
        for (let i = 0; i < subChunks.length - 1; i++) {
          result.push(subChunks[i]);
        }
        // 最后一块作为新 buffer 的起始
        if (subChunks.length > 0) {
          currentChunk = subChunks[subChunks.length - 1];
        }
      }
    }
  }

  if (currentChunk.length > 0) {
    result.push(currentChunk);
  }

  return result.filter(c => c.trim().length > 0);
}

/**
 * 使用智能句子分割来拆分超长段落
 * @param {string} text
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitBySmartSentences(text, maxLength) {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) {
    // 无法按句分割，回退到固定长度
    return splitByFixedLength(text, maxLength);
  }

  const result = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current.length > 0 ? current + sentence : sentence;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current.length > 0) {
        result.push(current);
      }
      if (sentence.length > maxLength) {
        // 单句超长，固定长度分割
        const subChunks = splitByFixedLength(sentence, maxLength);
        for (let i = 0; i < subChunks.length - 1; i++) {
          result.push(subChunks[i]);
        }
        current = subChunks[subChunks.length - 1] || '';
      } else {
        current = sentence;
      }
    }
  }

  if (current.length > 0) {
    result.push(current);
  }

  return result.filter(c => c.trim().length > 0);
}

/**
 * 固定长度分割（最终回退方案）
 * @param {string} text
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitByFixedLength(text, maxLength) {
  const result = [];
  for (let i = 0; i < text.length; i += maxLength) {
    const chunk = text.substring(i, Math.min(i + maxLength, text.length));
    if (chunk.trim().length > 0) {
      result.push(chunk);
    }
  }
  return result;
}

/**
 * 主分块函数
 * @param {Array} sections - parser.splitByHeadings() 的输出（content 已被保护）
 * @param {Array} outline - parser.extractOutline() 的输出
 * @param {Object} config - { minLength, maxLength, preserveHeadings }
 * @returns {Array<{content: string, headings: Array, position: number}>}
 */
function chunkSections(sections, outline, config) {
  const { maxLength = 2000 } = config;

  const result = [];
  let buffer = null;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionText = buildSectionText(section);

    if (!buffer) {
      buffer = {
        content: sectionText,
        headings: section.heading
          ? [{ heading: section.heading, level: section.level, position: section.position }]
          : [],
        position: section.position
      };
    } else {
      const merged = buffer.content + '\n\n' + sectionText;
      if (merged.length <= maxLength) {
        // 可以合并
        buffer.content = merged;
        if (section.heading) {
          buffer.headings.push({
            heading: section.heading,
            level: section.level,
            position: section.position
          });
        }
      } else {
        // 不能合并，先 flush 当前 buffer
        flushBuffer(buffer, result, outline, config);
        buffer = {
          content: sectionText,
          headings: section.heading
            ? [{ heading: section.heading, level: section.level, position: section.position }]
            : [],
          position: section.position
        };
      }
    }
  }

  // 处理最后的 buffer
  if (buffer && buffer.content.trim().length > 0) {
    flushBuffer(buffer, result, outline, config);
  }

  return result.filter(chunk => chunk.content.trim().length > 0);
}

/**
 * 构建完整标题路径（从文档根到指定标题的层级路径）
 * 通过遍历大纲，维护一个层级栈来构建从根到目标标题的完整路径
 * @param {Array} headings - 分块的标题数组 [{heading, level, position}]
 * @param {Array} outline - 文档大纲 [{title, level, position}]
 * @returns {string[]} - 完整标题路径，如 ['3', '3.1 催化剂制备', '3.1.1 浸渍法']
 */
function buildFullHeadingPath(headings, outline) {
  if (!headings || headings.length === 0) return [];

  // 无大纲时，退回到 headings 本身
  if (!outline || outline.length === 0) {
    return headings.map(h => typeof h === 'string' ? h : h.heading);
  }

  // 使用最后一个标题（最深层级）来构建完整路径
  const lastHeading = headings[headings.length - 1];
  const lastTitle = typeof lastHeading === 'string' ? lastHeading : lastHeading.heading;
  const lastIdx = outline.findIndex(o => o.title === lastTitle);

  if (lastIdx < 0) {
    return headings.map(h => typeof h === 'string' ? h : h.heading);
  }

  // 遍历大纲到目标位置，维护层级栈构建路径
  const stack = [];
  for (let i = 0; i <= lastIdx; i++) {
    while (stack.length > 0 && stack[stack.length - 1].level >= outline[i].level) {
      stack.pop();
    }
    stack.push({ level: outline[i].level, title: outline[i].title });
  }

  return stack.map(e => e.title);
}

/**
 * 将 buffer 输出到 result 数组
 * @param {Object} buffer - {content, headings, position}
 * @param {Array} result - 输出数组
 * @param {Array} outline - 大纲
 * @param {Object} config - 配置
 */
function flushBuffer(buffer, result, outline, config) {
  const { minLength = 800, maxLength = 2000, preserveHeadings = true } = config;
  const contentLen = buffer.content.trim().length;

  if (contentLen === 0) return;

  // 情况1：内容太短，尝试合并到上一块
  if (contentLen < minLength && result.length > 0) {
    const lastChunk = result[result.length - 1];
    const merged = lastChunk.content + '\n\n' + buffer.content;
    if (merged.length <= maxLength) {
      lastChunk.content = merged;
      lastChunk.headings = (lastChunk.headings || []).concat(buffer.headings || []);
      return;
    }
    // 合并不了，作为独立块输出（宁可短一些也不丢失）
  }

  // 构建完整标题路径（从文档根到最深标题的层级路径）
  const headingPath = buildFullHeadingPath(buffer.headings, outline);

  // 情况2：内容在范围内，直接输出
  if (contentLen <= maxLength) {
    result.push({
      content: buffer.content,
      headings: buffer.headings || [],
      headingPath,
      position: buffer.position || 0
    });
    return;
  }

  // 情况3：内容超长，需要拆分
  const subChunks = splitLongContent(buffer.content, maxLength);
  const pathStr = headingPath.join(' › ');

  for (let j = 0; j < subChunks.length; j++) {
    let chunkContent = subChunks[j];

    // 标题上下文保留：对 Part 2+ 添加完整标题路径信息
    // 使用引用格式添加上下文，保留多级标题层级关系
    if (preserveHeadings && pathStr && j > 0) {
      // 检查当前块是否已经以标题开头
      if (!chunkContent.trimStart().startsWith('#')) {
        const contextLine = `> Section: ${pathStr}`;
        chunkContent = contextLine + '\n\n' + chunkContent;
      }
    }

    result.push({
      content: chunkContent,
      // 保留完整标题信息，不再截断为仅第一级标题
      headings: buffer.headings || [],
      headingPath,
      position: buffer.position || 0,
      partIndex: subChunks.length > 1 ? j + 1 : undefined,
      totalParts: subChunks.length > 1 ? subChunks.length : undefined
    });
  }
}

/**
 * 标题归一化：统一为字符串数组
 * @param {Array} headings - 可能是 [{heading, level}] 或 ['string']
 * @returns {string[]}
 */
function normalizeHeadings(headings) {
  if (!headings) return [];
  return headings.map(h => typeof h === 'string' ? h : (h.heading || ''));
}

/**
 * 在大纲中查找指定标题的父级标题
 * @param {Array} outline - 文档大纲 [{title, level, position}]
 * @param {string} headingTitle - 要查找的标题文本
 * @returns {string|null} - 父级标题文本，无父级返回 null
 */
function findParentInOutline(outline, headingTitle) {
  if (!outline || outline.length === 0) return null;
  const idx = outline.findIndex(o => o.title === headingTitle);
  if (idx < 0) return null;

  const currentLevel = outline[idx].level;
  // 向前查找层级更浅的最近标题作为父节点
  for (let i = idx - 1; i >= 0; i--) {
    if (outline[i].level < currentLevel) {
      return outline[i].title;
    }
  }
  return null; // 顶级标题无父节点
}

/**
 * 计算两个分块的语义亲合度
 * 基于标题路径的共同前缀、交集标题和大纲兄弟关系来判断
 * @param {Object} chunkA - 分块A
 * @param {Object} chunkB - 分块B
 * @param {Array} outline - 文档大纲
 * @returns {number} - 亲合度分数，越高越相关（0 = 无关联）
 */
function computeSemanticAffinity(chunkA, chunkB, outline) {
  const hA = normalizeHeadings(chunkA.headings);
  const hB = normalizeHeadings(chunkB.headings);

  // 两者都没有标题，认为是连续正文内容，中等亲合度
  if (hA.length === 0 && hB.length === 0) return 2;

  // 一方无标题，弱亲合度
  if (hA.length === 0 || hB.length === 0) return 0.5;

  // 1. 检查标题路径的共同前缀
  //    构建各自的完整标题路径，比较前缀共享深度
  const pathA = buildFullHeadingPath(chunkA.headings, outline);
  const pathB = buildFullHeadingPath(chunkB.headings, outline);

  let commonPrefixLen = 0;
  const minLen = Math.min(pathA.length, pathB.length);
  for (let i = 0; i < minLen; i++) {
    if (pathA[i] === pathB[i]) commonPrefixLen++;
    else break;
  }

  // 有共同前缀说明属于同一上级章节，亲合度高
  if (commonPrefixLen > 0) return 3 + commonPrefixLen;

  // 2. 检查是否有交集标题
  const setA = new Set(hA);
  const overlap = hB.filter(h => setA.has(h)).length;
  if (overlap > 0) return 2 + overlap;

  // 3. 通过大纲分析是否为兄弟节点（同一父标题下）
  //    取 A 的最后一个标题和 B 的第一个标题来判断
  const lastTitleA = hA[hA.length - 1];
  const firstTitleB = hB[0];
  const parentA = findParentInOutline(outline, lastTitleA);
  const parentB = findParentInOutline(outline, firstTitleB);

  if (parentA !== null && parentB !== null && parentA === parentB) {
    return 1.5; // 兄弟节点
  }

  return 0; // 无语义关联
}

/**
 * 清理分块内容中由 flushBuffer 添加的续标题行
 * 续标题格式：> Section: ...
 * 合并后这些续标题不再需要，应当从合并结果中移除
 * @param {string} content - 分块内容
 * @returns {string} - 清理后的内容
 */
function stripContinuationTitles(content) {
  if (!content) return content
  // 移除内容中所有位置的续标题行（> Section: ... 或 > 所属章节：...），包括紧随其后的空行
  // 续标题可能出现在开头或中间（合并后位置不固定）
  return content
    .split('\n')
    .filter(line => !/^\s*>\s*(?:Section:|所属章节：)/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 合并过短分块：基于语义亲合度选择合并方向
 *
 * 合并策略：
 * - 计算短块与前后相邻块的语义亲合度
 * - 优先合并到亲合度更高的邻居（属于同一章节/小节）
 * - 如果两侧亲合度都很低，仅当块极短时才合并（避免碎片），否则保持独立
 * - 合并后超过安全上限时不合并
 *
 * @param {Array} chunks - 分块数组 [{content, headings, ...}]
 * @param {number} shortThreshold - 短块阈值（默认 500）
 * @param {number} maxLength - 合并后上限（超过 maxLength * 1.2 不合并）
 * @param {Array} outline - 文档大纲，用于语义分析
 * @returns {Array} - 处理后的分块数组
 */
function mergeShortChunks(chunks, shortThreshold = 500, maxLength = 4000, outline = []) {
  if (!chunks || chunks.length <= 1) return chunks;

  const merged = [...chunks];
  const sizeGuard = maxLength * 1.2;
  let i = 0;

  while (i < merged.length) {
    const chunk = merged[i];
    const len = chunk.content.trim().length;

    if (len >= shortThreshold) {
      i++;
      continue;
    }

    // 当前块过短，计算与相邻块的语义亲合度
    const prevAffinity = i > 0
      ? computeSemanticAffinity(merged[i - 1], chunk, outline)
      : -1;
    const nextAffinity = i < merged.length - 1
      ? computeSemanticAffinity(chunk, merged[i + 1], outline)
      : -1;

    let targetIdx = -1;

    if (prevAffinity > 0 && nextAffinity > 0) {
      // 两侧都有语义关联，选亲合度更高的
      targetIdx = prevAffinity >= nextAffinity ? i - 1 : i + 1;
    } else if (prevAffinity > 0) {
      targetIdx = i - 1;
    } else if (nextAffinity > 0) {
      targetIdx = i + 1;
    } else {
      // 两侧都无语义关联
      // 如果块极短（不到阈值一半），仍尝试合并到较短的邻居以避免碎片
      if (len < shortThreshold / 2) {
        const prevLen = i > 0 ? merged[i - 1].content.length : Infinity;
        const nextLen = i < merged.length - 1 ? merged[i + 1].content.length : Infinity;
        if (prevLen <= nextLen && prevLen < Infinity) targetIdx = i - 1;
        else if (nextLen < Infinity) targetIdx = i + 1;
      }
      // 否则保持不合并，避免破坏逻辑边界
    }

    if (targetIdx === -1) {
      i++;
      continue;
    }

    const target = merged[targetIdx]
    const mergedContent = targetIdx < i
      ? target.content + '\n\n' + chunk.content
      : chunk.content + '\n\n' + target.content
    
    if (mergedContent.length > sizeGuard) {
      // 合并后超过安全上限，跳过
      i++
      continue
    }
    
    // 执行合并，并清理合并结果中残留的续标题行（> Section: ... 或 > 所属章节：...）
    target.content = stripContinuationTitles(mergedContent)
    target.headings = (targetIdx < i)
      ? (target.headings || []).concat(chunk.headings || [])
      : (chunk.headings || []).concat(target.headings || []);

    // 根据合并后的 headings 重新计算 headingPath
    target.headingPath = buildFullHeadingPath(target.headings, outline)

    // 移除被合并的短块
    merged.splice(i, 1);

    // 合并到前面的邻居时，后退检查合并后的块是否仍然过短
    if (targetIdx < i) {
      i = targetIdx;
    }
    // targetIdx > i 时，不改变 i（删除当前块后，下一块已前移到 i）
  }

  return merged;
}

module.exports = {
  chunkSections,
  splitLongContent,
  mergeShortChunks,
  buildSectionText,
  buildFullHeadingPath,
  computeSemanticAffinity,
  normalizeHeadings
};
