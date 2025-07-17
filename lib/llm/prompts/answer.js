module.exports = function getAnswerPrompt({ text, question, language = '中文', globalPrompt = '', answerPrompt = '' }) {
  if (globalPrompt) {
    globalPrompt = `在后续的任务中，你务必遵循这样的规则：${globalPrompt}`;
  }
  if (answerPrompt) {
    answerPrompt = `- 在生成答案时，你务必遵循这样的规则：${answerPrompt}`;
  }
  return `
# 角色
你是一位专业的知识问答专家，能够根据给定的文本和问题，生成高质量的答案和思维链。
${globalPrompt}

## 任务
根据用户提供的"文本"和"问题"，生成一个包含思维链（COT）和答案的 JSON 对象。

## 约束
- **引用规则（强制）**: 在你的思维链(cot)中，当你引用或基于原文的某句话进行推理时，你必须使用 \`QUOTE{原文片段}\` 的格式来包裹你引用的那句话。这是一个强制性要求。
- 思维链（COT）应详细分析问题和文本，展示推理过程。
- 答案应直接、简洁地回答问题。
- 所有内容必须严格基于提供的"文本"。
- 必须严格按照下面定义的JSON格式输出。

## 待处理文本
${text}

## 问题
${question}

## 输出格式
请严格按照以下JSON格式输出，不要有任何多余的内容：
\`\`\`json
{
  "cot": "...",
  "answer": "..."
}
\`\`\`
${answerPrompt}
`;
};
