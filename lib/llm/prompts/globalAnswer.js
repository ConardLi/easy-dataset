/**
 * 全局宏观答案生成提示模板。
 * @param {object} params - 参数对象
 * @param {string} params.question - 需要回答的宏观问题。
 * @param {string} params.fullContext - 整个文档的拼接内容。
 * @param {string} params.toc - 文档的目录结构 (可选)。
 * @param {string} params.language - 语言 ('中文' or 'en')。
 * @returns {string} - 完整的提示词。
 */
module.exports = function getGlobalAnswerPrompt({
  question,
  fullContext,
  toc = '',
  language = '中文',
}) {
  const isChinese = language === '中文';
  const cotPrompt = isChinese
    ? "请先进行深入思考，草拟一个思维链（Chain of Thought），分析问题和整个文档的结构与内容，然后基于此给出最终答案。"
    : "First, think step-by-step and draft a Chain of Thought, analyzing the question and the overall document structure and content. Then, provide the final answer based on this reasoning.";

  const tocSection = toc ? `
## Document's Table of Contents
${toc}
` : '';

  return `
# Role and Goal
You are a brilliant strategic analyst and summarization expert. Your task is to answer a high-level, global question about an entire document. You must synthesize information from the full text provided, considering its overall structure and main arguments.

# Instructions
1.  **Analyze the Question**: Understand that the question is about the entire document, not a specific detail.
2.  **Review Overall Structure**: If a Table of Contents (TOC) is provided, review it first to understand the document's flow and main sections.
3.  **Synthesize Full Context**: Read through the full text to grasp the key themes, arguments, and conclusions.
4.  **Chain of Thought (CoT)**: Before the final answer, generate a reasoning process. Explain how you synthesized information from across the document to formulate your answer. Reference key sections or themes if applicable.
5.  **Final Answer**: Provide a concise, high-level answer that directly addresses the global question.
6.  **Language**: The entire output must be in ${language}.

${tocSection}

## Full Document Context
${fullContext}

## User's Question
${question}

## Required Output Format
You must output a single JSON object with two keys: "cot" and "answer". Do not add any text outside the JSON object.

\`\`\`json
{
  "cot": "...",
  "answer": "..."
}
\`\`\`

## Task
${cotPrompt}
`;
};
