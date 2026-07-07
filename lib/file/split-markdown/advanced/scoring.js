/**
 * 分块质量评分模块
 *
 * 对每个分块计算 0-100 的质量分数，用于预览界面展示。
 * 评分不持久化到数据库。
 */

/**
 * 对单个分块评分
 * @param {Object} chunk - {content, headings, partIndex, totalParts}
 * @param {Object} config - {minLength, maxLength}
 * @returns {number} - 0-100 的质量分数
 */
export function scoreChunk(chunk, config) {
  const { minLength = 800, maxLength = 2000 } = config;
  const content = chunk.content || '';
  const len = content.trim().length;

  let total = 0;

  // 1. 长度适当性 (0-20)
  total += scoreLengthAdequacy(len, minLength, maxLength);

  // 2. 标题存在 (0-20)
  total += scoreHeadingPresence(content, chunk.headings);

  // 3. 句子完整性 (0-25)
  total += scoreSentenceCompleteness(content);

  // 4. 原子块完整性 (0-20) - 算法保证，通常满分
  total += scoreAtomicIntegrity(content);

  // 5. 内容多样性 (0-15)
  total += scoreContentVariety(content);

  return Math.round(Math.min(100, Math.max(0, total)));
}

/**
 * 长度适当性评分 (0-20)
 * 在 [min, max] 范围内分5等份：中间满分20，次邻-2(18)，最边-5(15)
 * 区间外按比例衰减（上限15分）
 */
function scoreLengthAdequacy(len, minLength, maxLength) {
  if (len === 0) return 0;

  if (len >= minLength && len <= maxLength) {
    // 将区间分为5等份
    const segWidth = (maxLength - minLength) / 5;
    const segIndex = Math.min(4, Math.floor((len - minLength) / segWidth));

    // segIndex: 0=最左, 1=次左, 2=中间, 3=次右, 4=最右
    switch (segIndex) {
      case 2: return 20;         // 中间1/5：满分
      case 1: case 3: return 18; // 次邻1/5：-2分
      case 0: case 4: return 15; // 最边1/5：-5分
      default: return 15;
    }
  } else if (len < minLength) {
    // 低于最小值：按比例衰减，上限15
    return (len / minLength) * 15;
  } else {
    // 超过最大值：按比例衰减，上限15
    return (maxLength / len) * 15;
  }
}

/**
 * 标题存在评分 (0-20)
 */
function scoreHeadingPresence(content, headings) {
  // 检查内容是否以标题行开头
  const startsWithHeading = /^\s*#{1,6}\s+/.test(content);
  const hasHeadings = headings && headings.length > 0;

  if (startsWithHeading) return 20;
  if (hasHeadings) return 15;

  // 检查内容是否以引用格式章节标记开头（> Section: ... 或 > 所属章节：...）
  // 这是拆分块补全标题上下文时添加的等效标题信息
  if (/^\s*>\s*(?:Section:|所属章节：)/.test(content)) return 15;

  // 检查内容中是否有标题
  if (/^#{1,6}\s+/m.test(content)) return 12;

  return 0;
}

/**
 * 句子完整性评分 (0-25)
 * 检查块是否以完整句子或完整原子块结束
 */
function scoreSentenceCompleteness(content) {
  const trimmed = content.trim();
  if (trimmed.length === 0) return 0;

  let score = 12; // 基础分

  // 以句号/感叹号/问号结尾
  const lastChar = trimmed[trimmed.length - 1];
  if ('.!?。！？'.includes(lastChar)) {
    score += 5;
  }

  // 以代码块结尾（```）
  if (trimmed.endsWith('```')) {
    score += 5;
  }

  // 以闭合 HTML 标签结尾（</table>, </div> 等）
  const endsWithHtmlClose = /<\/[a-zA-Z][a-zA-Z0-9]*\s*>\s*$/.test(trimmed);
  if (endsWithHtmlClose) {
    score += 5;
  }

  // 以 display math block 结尾（$$）
  const endsWithDisplayMath = /\$\$\s*$/.test(trimmed);
  if (endsWithDisplayMath) {
    score += 5;
  }

  // 以 Markdown 表格行结尾（|...|）
  const lastLine = trimmed.split('\n').pop().trim();
  const endsWithTableRow = /^\|.+\|$/.test(lastLine);
  if (endsWithTableRow) {
    score += 5;
  }

  // 以完整标点结尾（包括引号、括号闭合，以及语义等价的原子块结尾）
  if (/[.!?。！？）\)」』\]】]$/.test(trimmed) || endsWithHtmlClose || endsWithDisplayMath || endsWithTableRow) {
    score += 5;
  }

  // 以连接词/指代词开头（表示上文不完整）
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  const englishConnectives = ['and', 'but', 'however', 'therefore', 'moreover', 'furthermore', 'thus'];
  const chineseConnectives = ['上述', '前述', '上列', '前者', '如下', '下列', '以下', '该', '此', '这些', '此项', '此法', '此外', '另外', '因而', '故', '进而', '继而', '其中', '后者', '见表', '参见', '详见', '见下文', '见下表'];
  if (englishConnectives.includes(firstWord) || chineseConnectives.some(w => trimmed.startsWith(w))) {
    score -= 3;
  }

  return Math.min(25, Math.max(0, score));
}

/**
 * 检查 HTML 表格标签是否成对出现
 * @param {string} content
 * @returns {boolean}
 */
function hasUnbalancedHtmlTable(content) {
  const openCount = (content.match(/<table\b[^>]*>/gi) || []).length;
  const closeCount = (content.match(/<\/table\s*>/gi) || []).length;
  return openCount !== closeCount;
}

/**
 * 原子块完整性评分 (0-20)
 * 检查是否有未闭合的表格、代码块、公式
 */
function scoreAtomicIntegrity(content) {
  let score = 20; // 满分起始

  // 检查未闭合的代码块
  const fenceMatches = content.match(/^(`{3,}|~{3,})/gm);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    score -= 10;
  }

  // 检查未闭合的显示数学块
  const doubleDollarCount = (content.match(/\$\$/g) || []).length;
  if (doubleDollarCount % 2 !== 0) {
    score -= 10;
  }

  // 检查 HTML 表格是否被切断
  if (hasUnbalancedHtmlTable(content)) {
    score -= 10;
  }

  // 检查 Markdown 表格是否完整（有表头分隔行）
  const tableRows = content.match(/^\|.*\|$/gm);
  if (tableRows && tableRows.length > 0) {
    const hasSeparator = tableRows.some(row => /^\|[\s\-:|]+\|$/.test(row));
    if (!hasSeparator && tableRows.length > 1) {
      score -= 5; // 有表格行但缺少分隔行
    }
  }

  return Math.max(0, score);
}

/**
 * 内容多样性评分 (0-15)
 * 有文本+结构元素的混合得高分
 */
function scoreContentVariety(content) {
  let score = 5; // 基础分

  // 有表格
  if (/^\|.*\|$/m.test(content)) score += 2;

  // 有数学公式
  if (/\$[^$]+\$/.test(content) || /\$\$[\s\S]+?\$\$/.test(content)) score += 2;

  // 有列表
  if (/^\s*[-*+]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content)) score += 2;

  // 有代码块
  if (/^```/m.test(content)) score += 2;

  // 有普通文本段落（至少 100 字符的非结构化文本）
  const plainText = content
    .replace(/^\|.*\|$/gm, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*[-*+]\s+.*/gm, '')
    .replace(/^\s*\d+\.\s+.*/gm, '')
    .replace(/^#{1,6}\s+.*/gm, '')
    .trim();

  if (plainText.length > 100) score += 5;

  return Math.min(15, score);
}

/**
 * 对所有分块计算统计信息
 * @param {Array} chunks - 分块数组（每块需有 qualityScore）
 * @param {Object} config - 配置
 * @returns {Object} - { avg, min, max, totalChunks, avgSize, minSize, maxSize }
 */
export function scoreAll(chunks, config) {
  if (!chunks || chunks.length === 0) {
    return { avg: 0, min: 0, max: 0, totalChunks: 0, avgSize: 0, minSize: 0, maxSize: 0 };
  }

  const scores = chunks.map(c => c.qualityScore || scoreChunk(c, config));
  const sizes = chunks.map(c => (c.content || '').trim().length);

  return {
    totalChunks: chunks.length,
    avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    min: Math.min(...scores),
    max: Math.max(...scores),
    avgSize: Math.round(sizes.reduce((s, v) => s + v, 0) / sizes.length),
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes)
  };
}


