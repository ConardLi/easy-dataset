/**
 * Markdown文档分割模块
 */

/**
 * 分割超长段落
 * @param {Object} section - 段落对象
 * @param {number} maxSplitLength - 最大分割字数
 * @returns {Array} - 分割后的段落数组
 */
function splitLongSection(section, maxSplitLength) {
  const content = section.content;
  const paragraphs = content.split(/\n\n+/);
  const result = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // 如果当前段落本身超过最大长度，可能需要进一步拆分
    if (paragraph.length > maxSplitLength) {
      // 如果当前块不为空，先加入结果
      if (currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = '';
      }

      // 对超长段落进行分割（例如，按句子或固定长度）
      const sentenceSplit = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

      // 处理分割后的句子
      let sentenceChunk = '';
      for (const sentence of sentenceSplit) {
        if ((sentenceChunk + sentence).length <= maxSplitLength) {
          sentenceChunk += sentence;
        } else {
          if (sentenceChunk.length > 0) {
            result.push(sentenceChunk);
          }
          // 如果单个句子超过最大长度，可能需要进一步拆分
          if (sentence.length > maxSplitLength) {
            // 简单地按固定长度分割
            for (let i = 0; i < sentence.length; i += maxSplitLength) {
              result.push(sentence.substr(i, maxSplitLength));
            }
          } else {
            sentenceChunk = sentence;
          }
        }
      }

      if (sentenceChunk.length > 0) {
        currentChunk = sentenceChunk;
      }
    } else if ((currentChunk + '\n\n' + paragraph).length <= maxSplitLength) {
      // 如果添加当前段落不超过最大长度，则添加到当前块
      currentChunk = currentChunk.length > 0 ? currentChunk + '\n\n' + paragraph : paragraph;
    } else {
      // 如果添加当前段落超过最大长度，则将当前块加入结果，并重新开始一个新块
      result.push(currentChunk);
      currentChunk = paragraph;
    }
  }

  // 添加最后一个块（如果有）
  if (currentChunk.length > 0) {
    result.push(currentChunk);
  }

  return result;
}

/**
 * 处理段落，根据最小和最大分割字数进行分割
 * @param {Array} sections - 段落数组
 * @param {Array} outline - 目录大纲
 * @param {number} minSplitLength - 最小分割字数
 * @param {number} maxSplitLength - 最大分割字数
 * @returns {Array} - 处理后的段落数组
 */
function processSections(sections, outline, minSplitLength, maxSplitLength) {
  // 预处理：将相邻的小段落合并
  const preprocessedSections = [];
  let currentSection = null;

  for (const section of sections) {
    const contentLength = section.content.trim().length;

    if (contentLength < minSplitLength && currentSection) {
      // 如果当前段落小于最小长度且有累积段落，尝试合并
      const mergedContent = `${currentSection.content}\n\n${section.heading ? `${'#'.repeat(section.level)} ${section.heading}\n` : ''}${section.content}`;

      if (mergedContent.length <= maxSplitLength) {
        // 如果合并后不超过最大长度，则合并
        currentSection.content = mergedContent;
        if (section.heading) {
          currentSection.headings = currentSection.headings || [];
          currentSection.headings.push({
            heading: section.heading,
            level: section.level,
            position: section.position
          });
        }
        continue;
      }
    }

    // 如果无法合并，则开始新的段落
    if (currentSection) {
      preprocessedSections.push(currentSection);
    }
    currentSection = {
      ...section,
      headings: section.heading ? [{ heading: section.heading, level: section.level, position: section.position }] : []
    };
  }

  // 添加最后一个段落
  if (currentSection) {
    preprocessedSections.push(currentSection);
  }

  const result = [];
  let accumulatedSection = null; // 用于累积小于最小分割字数的段落

  for (let i = 0; i < preprocessedSections.length; i++) {
    const section = preprocessedSections[i];
    const contentLength = section.content.trim().length;

    // 检查是否需要累积段落
    if (contentLength < minSplitLength) {
      // 如果还没有累积过段落，创建新的累积段落
      if (!accumulatedSection) {
        accumulatedSection = {
          heading: section.heading,
          level: section.level,
          content: section.content,
          position: section.position,
          headings: [{ heading: section.heading, level: section.level, position: section.position }]
        };
      } else {
        // 已经有累积段落，将当前段落添加到累积段落中
        accumulatedSection.content += `\n\n${section.heading ? `${'#'.repeat(section.level)} ${section.heading}\n` : ''}${section.content}`;
        if (section.heading) {
          accumulatedSection.headings.push({
            heading: section.heading,
            level: section.level,
            position: section.position
          });
        }
      }

      // 只有当累积内容达到最小长度时才处理
      const accumulatedLength = accumulatedSection.content.trim().length;
      if (accumulatedLength >= minSplitLength) {
        const summary = require('./summary').generateEnhancedSummary(accumulatedSection, outline);

        if (accumulatedLength > maxSplitLength) {
          // 如果累积段落超过最大长度，进一步分割
          const subSections = splitLongSection(accumulatedSection, maxSplitLength);

          for (let j = 0; j < subSections.length; j++) {
            result.push({
              summary: `${summary} - Part ${j + 1}/${subSections.length}`,
              content: subSections[j]
            });
          }
        } else {
          // 添加到结果中
          result.push({
            summary,
            content: accumulatedSection.content
          });
        }

        accumulatedSection = null; // 重置累积段落
      }

      continue;
    }

    // 如果有累积的段落，先处理它
    if (accumulatedSection) {
      const summary = require('./summary').generateEnhancedSummary(accumulatedSection, outline);
      const accumulatedLength = accumulatedSection.content.trim().length;

      if (accumulatedLength > maxSplitLength) {
        // 如果累积段落超过最大长度，进一步分割
        const { result: subSections, lastChunk } = splitLongSection(accumulatedSection, maxSplitLength, minSplitLength);

        for (let j = 0; j < subSections.length; j++) {
          result.push({
            summary: `${summary} - Part ${j + 1}/${subSections.length}`,
            content: subSections[j]
          });
        }

        // 如果有未处理的小段落，保存下来等待下一次合并
        if (lastChunk) {
          accumulatedSection = {
            ...accumulatedSection,
            content: lastChunk
          };
          continue;
        }
      } else {
        // 添加到结果中
        result.push({
          summary,
          content: accumulatedSection.content
        });
      }

      accumulatedSection = null; // 重置累积段落
    }

    // 处理当前段落
    // 如果段落长度超过最大分割字数，需要进一步分割
    if (contentLength > maxSplitLength) {
      const subSections = splitLongSection(section, maxSplitLength);

      // 为当前段落创建一个标准的headings数组
      if (!section.headings && section.heading) {
        section.headings = [{ heading: section.heading, level: section.level, position: section.position }];
      }

      for (let i = 0; i < subSections.length; i++) {
        const subSection = subSections[i];
        const summary = require('./summary').generateEnhancedSummary(section, outline, i + 1, subSections.length);

        result.push({
          summary,
          content: subSection
        });
      }
    } else {
      // 为当前段落创建一个标准的headings数组
      if (!section.headings && section.heading) {
        section.headings = [{ heading: section.heading, level: section.level, position: section.position }];
      }

      // 生成增强的摘要并添加到结果
      const summary = require('./summary').generateEnhancedSummary(section, outline);

      const content = `${section.heading ? `${'#'.repeat(section.level)} ${section.heading}\n` : ''}${section.content}`;

      result.push({
        summary,
        content,
      });
    }
  }

  // 处理最后剩余的小段落
  if (accumulatedSection) {
    if (result.length > 0) {
      // 尝试将剩余的小段落与最后一个结果合并
      const lastResult = result[result.length - 1];
      const mergedContent = `${lastResult.content}\n\n${accumulatedSection.content}`;

      if (mergedContent.length <= maxSplitLength) {
        // 如果合并后不超过最大长度，则合并
        const summary = require('./summary').generateEnhancedSummary({
          ...accumulatedSection,
          content: mergedContent
        }, outline);

        result[result.length - 1] = {
          summary,
          content: mergedContent
        };
      } else {
        // 如果合并后超过最大长度，将accumulatedSection作为单独的段落添加，这里的contentLength一定小于maxSplitLength
        const summary = require('./summary').generateEnhancedSummary(accumulatedSection, outline);
        const content = `${accumulatedSection.heading ? `${'#'.repeat(accumulatedSection.level)} ${accumulatedSection.heading}\n` : ''}${accumulatedSection.content}`;
        result.push({
          summary,
          content
        });
      }
    } else {
      // 如果result为空，直接添加accumulatedSection
      const summary = require('./summary').generateEnhancedSummary(accumulatedSection, outline);
      const content = `${accumulatedSection.heading ? `${'#'.repeat(accumulatedSection.level)} ${accumulatedSection.heading}\n` : ''}${accumulatedSection.content}`;
      result.push({
        summary,
        content
      });
    }
  }

  return result;
}

module.exports = {
  splitLongSection,
  processSections
};
