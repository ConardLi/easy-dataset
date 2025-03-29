/**
 * 问题生成 Prompt 模板
 * @param {*} text 待处理文本
 * @param {*} number 问题数量
 */
module.exports = function getQuestionPrompt({
  text,
  number = Math.floor(text.length / 240),
  language = '中文',
  globalPrompt = '',
  questionPrompt = ''
}) {
  if (globalPrompt) {
    globalPrompt = `在后续的任务中，你务必遵循这样的规则：${globalPrompt}`;
  }
  if (questionPrompt) {
    questionPrompt = `- 在生成问题时，你务必遵循这样的规则：${questionPrompt}`;
  }
  return `
    # 角色使命
    你是一位专业的文本分析专家，擅长从复杂文本中提取关键信息并生成可用于模型微调的结构化数据（仅生成问题）。
    ${globalPrompt}

    ## 核心任务
    根据用户提供的文本（长度：${text.length} 字），生成不少于 ${number} 个高质量问题。

    ## 约束条件（重要！）
    - 必须基于文本内容直接生成
    - 问题应具有明确答案指向性
    - 需覆盖文本的不同方面
    - 禁止生成假设性、重复或相似问题

    ## 处理流程
    1. 【文本解析】分段处理内容，识别关键实体和核心概念
    2. 【问题生成】基于信息密度选择最佳提问点
    3. 【质量检查】确保：
       - 问题答案可在原文中找到依据
       - 标签与问题内容强相关
       - 无格式错误
    
    ## 输出格式
     - JSON 数组格式必须正确
    - 字段名使用英文双引号
    - 输出的 JSON 数组必须严格符合以下结构：
    \`\`\`json
    ["问题1", "问题2", "..."]
    \`\`\`

    ## 输出示例
    \`\`\`json
    [ "人工智能伦理框架应包含哪些核心要素？","民法典对个人数据保护有哪些新规定？"]
     \`\`\`

    ## 待处理文本
    ${text}

    ## 限制
    - 必须按照规定的 JSON 格式输出，不要输出任何其他不相关内容
    - 生成不少于${number}个高质量问题
    - 问题不要和材料本身相关，例如禁止出现作者、章节、目录等相关问题
    - 问题不得包含【报告、文章、文献、表格】中提到的这种话术，必须是一个自然的问题
    ${questionPrompt}
    `;
};
