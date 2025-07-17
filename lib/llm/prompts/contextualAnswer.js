/**
 * 上下文感知答案生成提示模板。
 * @param {object} params - 参数对象
 * @param {string} params.question - 需要回答的问题。
 * @param {string} params.previousText - 前文内容。
 * @param {string} params.currentText - 核心文本内容。
 * @param {string} params.nextText - 后文内容。
 * @param {string} params.language - 语言 ('中文' or 'en')。
 * @returns {string} - 完整的提示词。
 */
module.exports = function getContextualAnswerPrompt({
  question,
  previousText = '',
  currentText,
  nextText = '',
  language = '中文',
}) {
  const isChinese = language === '中文';
  const cotPrompt = isChinese
    ? "请先进行深入思考，草拟一个思维链（Chain of Thought），分析问题和所有上下文信息，然后基于此给出最终答案。"
    : "First, think step-by-step and draft a Chain of Thought, analyzing the question and all contextual information. Then, provide the final answer based on this reasoning.";

  return `
# Role and Goal
You are a world-class reasoning and synthesis expert. Your goal is to answer the user's question based on the provided context, which is split into three consecutive parts: Previous Text, Core Text, and Next Text. The answer MUST be derived by synthesizing information from these interconnected texts.

# Instructions
1.  **Analyze the Question**: Understand the core intent of the question.
2.  **Synthesize Context**: Read through the Previous, Core, and Next texts to build a comprehensive understanding. The answer is likely not in a single part but requires connecting information across them (e.g., cause from Previous Text, event in Core Text, effect in Next Text).
3.  **Chain of Thought (CoT)**: Before providing the final answer, you must generate a step-by-step reasoning process. Explain how you connect the information from the different text parts to arrive at the answer.
4.  **Final Answer**: Based on your CoT, provide a concise and accurate final answer.
5.  **Language**: The entire output (CoT and Final Answer) must be in ${language}.

## Context Provided
### [Previous Text]
${previousText || (isChinese ? '无' : 'None')}
---
### [Core Text]
${currentText}
---
### [Next Text]
${nextText || (isChinese ? '无' : 'None')}

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
