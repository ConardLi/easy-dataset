/**
 * 智能句子分割模块
 *
 * 替代现有的简陋正则 /[^.!?。！？]+[.!?。！？]+/g
 * 使用两遍扫描法避免在小数、缩写、代码中误断。
 */

const { containsPlaceholder } = require('./atomics');

/**
 * 常见缩写列表（不应在其后的句点处分割）
 */
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr',
  'fig', 'figs', 'eq', 'eqs', 'no', 'nos', 'vol', 'vols',
  'vs', 'etc', 'approx', 'dept', 'est', 'inc', 'ltd', 'co',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'rev', 'ed', 'trans', 'repr', 'pt', 'ch', 'sec', 'ref', 'refs',
  'min', 'max', 'avg', 'temp', 'conc', 'mol', 'wt', 'vol',
  // 学术/化工常用
  'al',  // et al.
  'i.e', 'e.g', 'cf', 'resp', 'ca', 'viz'
]);

/**
 * 判断给定位置的句子终止符是否为有效的分割点
 * @param {string} text - 完整文本
 * @param {number} pos - 句子终止符（. ! ? 等）在文本中的位置
 * @returns {boolean} - 是否为有效分割点
 */
function isValidBreak(text, pos) {
  const char = text[pos];

  // 只处理 . ! ? 及中文对应符号
  if (!'。！？.!?'.includes(char)) return false;

  // 中文句号、感叹号、问号几乎总是有效的分割点
  if ('。！？'.includes(char)) return true;

  // 以下仅对 . ! ? 做额外检查

  // 1. 检查是否为省略号 ...
  if (char === '.' && pos >= 2 && text[pos - 1] === '.' && text[pos - 2] === '.') return false;
  if (char === '.' && pos + 1 < text.length && text[pos + 1] === '.') return false;

  // 2. 检查句点后是否紧跟空白或行尾（非句子边界通常紧跟非空白）
  const afterChar = pos + 1 < text.length ? text[pos + 1] : '\n';
  if (char === '.' && !/[\s\n\r]/.test(afterChar)) return false;

  // 3. 检查数字上下文：3.14, pH 7.0
  if (char === '.') {
    const beforeChar = pos > 0 ? text[pos - 1] : '';
    if (/\d/.test(beforeChar) && /[\d\s]/.test(afterChar)) return false;
  }

  // 4. 检查缩写
  if (char === '.') {
    // 提取句点前的单词
    let wordStart = pos - 1;
    while (wordStart >= 0 && /[a-zA-Z.]/.test(text[wordStart])) {
      wordStart--;
    }
    wordStart++;
    const word = text.substring(wordStart, pos).toLowerCase().replace(/\.$/, '');

    // 单字母缩写（如 U.S.A., A.）
    if (word.length <= 1 && /[a-zA-Z]/.test(word)) return false;

    // 检查缩写列表
    if (ABBREVIATIONS.has(word)) return false;

    // 带句点的复合缩写: e.g., i.e.
    const compoundWord = text.substring(wordStart, pos + 1).toLowerCase();
    if (ABBREVIATIONS.has(compoundWord.replace(/\.$/, ''))) return false;
  }

  // 5. ! 和 ? 通常总是有效的分割点（除了连续的 ?! 或 !!）
  if (char === '!' || char === '?') {
    if (pos + 1 < text.length && (text[pos + 1] === '!' || text[pos + 1] === '?')) return false;
    return true;
  }

  return true;
}

/**
 * 将文本分割为句子数组
 * @param {string} text - 输入文本（可能包含占位符）
 * @returns {string[]} - 句子数组
 */
function splitSentences(text) {
  if (!text || text.trim().length === 0) return [];

  // 如果文本很短，不分割
  if (text.length < 50) return [text];

  const sentences = [];
  let lastBreak = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 跳过占位符区域
    if (char === '\x00') {
      // 找到占位符结束
      const endIdx = text.indexOf('\x00', i + 1);
      if (endIdx > i) {
        i = endIdx;
        continue;
      }
    }

    if ('.!?。！？'.includes(char) && isValidBreak(text, i)) {
      // 找到有效分割点
      const breakPos = i + 1;

      // 跳过分割点后的空白
      let nextContentPos = breakPos;
      while (nextContentPos < text.length && /[\s]/.test(text[nextContentPos]) && text[nextContentPos] !== '\n') {
        nextContentPos++;
      }

      const sentence = text.substring(lastBreak, breakPos).trim();
      if (sentence.length > 0) {
        sentences.push(text.substring(lastBreak, nextContentPos));
        lastBreak = nextContentPos;
      }
    }
  }

  // 添加最后一个句子
  if (lastBreak < text.length) {
    const remaining = text.substring(lastBreak).trim();
    if (remaining.length > 0) {
      sentences.push(text.substring(lastBreak));
    }
  }

  // 如果没能分割出任何句子，返回原文
  if (sentences.length === 0 && text.trim().length > 0) {
    return [text];
  }

  return sentences;
}

module.exports = {
  splitSentences,
  isValidBreak,
  ABBREVIATIONS
};
