/**
 * 增强版答案生成提示词 - 基于GA pairs
 * @param {Object} params - 参数对象
 * @param {string} params.text - 参考文本内容
 * @param {string} params.question - 问题内容
 * @param {string} params.language - 语言
 * @param {string} params.globalPrompt - 全局提示词
 * @param {string} params.answerPrompt - 答案提示词
 * @param {Array} params.gaPairs - GA pairs数组，包含genre和audience信息
 * @param {Object} params.activeGaPair - 当前激活的GA pair
 */
export default function getEnhancedAnswerPrompt({
  text,
  question,
  globalPrompt = '',
  answerPrompt = '',
  activeGaPair = null
}) {
  if (globalPrompt) {
    globalPrompt = `在后续的任务中，你务必遵循这样的规则：${globalPrompt}`;
  }
  if (answerPrompt) {
    answerPrompt = `- 在生成答案时，你务必遵循这样的规则：${answerPrompt}`;
  }

  let gaPrompt = '';
  if (activeGaPair && activeGaPair.active) {
    gaPrompt = `
## 特殊要求 - 体裁与受众适配(MGA)：
根据以下体裁与受众组合，调整你的回答风格和深度：
- **当前体裁**: ${activeGaPair.genre}
- **目标受众**: ${activeGaPair.audience}
`;
  }

  return `
# 角色
你是一位专业的知识问答专家，能够根据给定的文本、问题以及风格要求，生成高质量的答案和思维链。
${globalPrompt}

## 任务
根据用户提供的"文本"、"问题"以及"特殊要求"，生成一个包含思维链（COT）和答案的 JSON 对象。

${gaPrompt}

## 核心约束
- **引用规则（强制）**: 在你的思维链(cot)中，当你引用或基于原文的某句话进行推理时，你必须使用 \`QUOTE{原文片段}\` 的格式来包裹你引用的那句话。这是一个强制性要求。
- 思维链（COT）应详细分析问题和文本，展示推理过程，并体现出对"特殊要求"的理解。
- 答案应直接、简洁地回答问题，并符合"特殊要求"的风格。
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
}
