/**
 * Advanced Markdown 分块编排器
 *
 * 主入口：splitAdvancedMarkdown(markdownText, config)
 * 采用"保护-分割-还原"模式处理 Markdown 文档。
 */

const parser = require('../core/parser');
const summary = require('../core/summary');
const { detectAndProtect, restore } = require('./atomics');
const { chunkSections, mergeShortChunks } = require('./chunker');
const { scoreChunk, scoreAll } = require('./scoring');

/**
 * 对所有段落执行原子块保护
 * 注意：保护是在全文级别进行的，然后再按标题分段
 * 这样可以正确处理跨段的原子块（如紧跟标题之后的表格）
 * @param {string} markdownText - 原始 Markdown 文本
 * @returns {{ protectedText: string, atomMap: Array }}
 */
function protectFullText(markdownText) {
  return detectAndProtect(markdownText);
}

/**
 * 后处理：检测并修复每个分块末尾残留的孤立标题行
 * 将末尾标题移动到下一个分块的开头
 * @param {Array} chunks
 * @returns {Array}
 */
function fixTrailingHeadings(chunks) {
  if (!chunks || chunks.length <= 1) return chunks;

  for (let i = 0; i < chunks.length - 1; i++) {
    const lines = chunks[i].content.split('\n');

    // 找到末尾最后一个非空行
    let lastLineIdx = lines.length - 1;
    while (lastLineIdx >= 0 && lines[lastLineIdx].trim() === '') {
      lastLineIdx--;
    }
    if (lastLineIdx < 0) continue;

    const lastLine = lines[lastLineIdx].trim();

    // 如果末尾非空行是标题行，将其（及之后的空行）移到下一块开头
    if (/^#{1,6}\s+/.test(lastLine)) {
      // 截取标题行之前的内容
      chunks[i] = {
        ...chunks[i],
        content: lines.slice(0, lastLineIdx).join('\n').trimEnd()
      };

      // 将标题行前置到下一块
      const headingLine = lines.slice(lastLineIdx).join('\n').trim();
      chunks[i + 1] = {
        ...chunks[i + 1],
        content: headingLine + '\n\n' + chunks[i + 1].content
      };
    }
  }

  // 过滤掉因移出标题而变为空的块
  return chunks.filter(c => c.content.trim().length > 0);
}

/**
 * Advanced Markdown 分块主函数
 * @param {string} markdownText - 原始 Markdown 文本
 * @param {Object} config - 分块配置
 * @param {number} config.minLength - 最小分块字符数（默认 800）
 * @param {number} config.maxLength - 最大分块字符数（默认 2000）
 * @param {boolean} config.preserveHeadings - 是否在拆分块中保留标题上下文（默认 true）
 * @returns {{ chunks: Array, stats: Object, outline: Array }}
 */
function splitAdvancedMarkdown(markdownText, config = {}) {
  const mergedConfig = {
    minLength: config.minLength || 800,
    maxLength: config.maxLength || 2000,
    preserveHeadings: config.preserveHeadings !== false
  };

  // 确保 minLength < maxLength
  if (mergedConfig.minLength >= mergedConfig.maxLength) {
    mergedConfig.minLength = Math.floor(mergedConfig.maxLength * 0.6);
  }

  // 1. 提取大纲（复用现有模块）
  const outline = parser.extractOutline(markdownText);

  // 2. 保护原子块（全文级别）
  const { protectedText, atomMap } = protectFullText(markdownText);

  // 3. 在已保护的文本上按标题分段（复用现有模块）
  const protectedOutline = parser.extractOutline(protectedText);
  const sections = parser.splitByHeadings(protectedText, protectedOutline);

  // 4. 分块引擎处理
  let chunks = chunkSections(sections, protectedOutline, mergedConfig);

  // 5. 还原占位符为原始内容
  chunks = chunks.map(chunk => ({
    ...chunk,
    content: restore(chunk.content, atomMap)
  }));

  // 6. 过滤空块
  chunks = chunks.filter(chunk => chunk.content.trim().length > 0);

  // 6.5 合并过短分块（基于语义亲合度选择合并方向）
  chunks = mergeShortChunks(chunks, 700, mergedConfig.maxLength, outline);

  // 6.7 修复尾部残留标题：将末尾孤立的标题行移动到下一块开头
  chunks = fixTrailingHeadings(chunks);

  // 7. 生成增强摘要（复用现有模块）
  chunks.forEach((chunk, index) => {
    try {
      // 构造 summary 模块需要的 section 对象
      const sectionForSummary = {
        heading: chunk.headings && chunk.headings.length > 0 ? chunk.headings[0].heading : null,
        level: chunk.headings && chunk.headings.length > 0 ? chunk.headings[0].level : 0,
        content: chunk.content,
        position: chunk.position || 0,
        headings: chunk.headings || []
      };

      chunk.summary = summary.generateEnhancedSummary(
        sectionForSummary,
        outline,
        chunk.partIndex || null,
        chunk.totalParts || null
      );
    } catch (e) {
      console.error('摘要生成失败，使用 fallback:', e.message || e);
      chunk.summary = chunk.headings && chunk.headings.length > 0
        ? chunk.headings.map(h => h.heading).join(' > ')
        : `Chunk ${index + 1}`;
    }
  });

  // 8. 质量评分
  chunks.forEach(chunk => {
    chunk.qualityScore = scoreChunk(chunk, mergedConfig);
  });

  // 9. 清理输出（移除内部字段）
  const cleanChunks = chunks.map((chunk, index) => ({
    content: chunk.content,
    summary: chunk.summary || `Chunk ${index + 1}`,
    qualityScore: chunk.qualityScore || 0,
    size: chunk.content.length,
    headings: (chunk.headings || []).map(h => h.heading),
    headingPath: chunk.headingPath || [],
    partIndex: chunk.partIndex,
    totalParts: chunk.totalParts
  }));

  // 10. 统计信息
  const stats = scoreAll(cleanChunks, mergedConfig);

  return {
    chunks: cleanChunks,
    stats,
    outline
  };
}

module.exports = {
  splitAdvancedMarkdown
};
