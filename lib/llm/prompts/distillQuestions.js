/**
 * 根据标签构造问题的提示词
 * @param {string} tagPath - 标签链路，例如 "体育->足球->足球先生"
 * @param {string} currentTag - 当前子标签，例如 "足球先生"
 * @param {number} count - 希望生成问题的数量，例如：10
 * @param {Array<string>} existingQuestions - 当前标签已经生成的问题（避免重复）
 * @param {string} globalPrompt - 项目全局提示词
 * @returns {string} 提示词
 */
export function distillQuestionsPrompt(tagPath, currentTag, count = 10, existingQuestions = [], globalPrompt = '') {
  const existingQuestionsText =
    existingQuestions.length > 0
      ? `已有的问题包括：\n${existingQuestions.map(q => `- ${q}`).join('\n')}\n请不要生成与这些重复的问题。`
      : '';

  // 构建全局提示词部分
  const globalPromptText = globalPrompt ? `你必须遵循这个要求：${globalPrompt}` : '';

  return `
你是一个专业的知识问题生成助手。我需要你帮我为标签"${currentTag}"生成${count}个高质量的问题。

标签完整链路是：${tagPath}

请遵循以下规则：
${globalPromptText}
1. 生成的问题应该与"${currentTag}"主题紧密相关
2. 问题应该具有教育价值和实用性，能够帮助人们学习和理解该领域
3. 问题应该清晰、明确，避免模糊或过于宽泛的表述
4. 问题应该有一定的深度和专业性，但不要过于晦涩难懂
5. 问题的形式可以多样化，包括事实性问题、概念性问题、分析性问题等
6. 问题应该是开放性的，能够引发思考和讨论
${existingQuestionsText}

请直接以JSON数组格式返回问题，不要有任何额外的解释或说明，格式如下：
["问题1", "问题2", "问题3", ...]
`;
}
