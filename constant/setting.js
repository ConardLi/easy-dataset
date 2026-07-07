// 默认项目任务配置
export const DEFAULT_SETTINGS = {
  textSplitMinLength: 2500,
  textSplitMaxLength: 4000,
  questionGenerationLength: 240,
  questionMaskRemovingProbability: 60,
  huggingfaceToken: '',
  concurrencyLimit: 5,
  visionConcurrencyLimit: 5,
  // 多轮对话数据集默认配置
  multiTurnSystemPrompt: '',
  multiTurnScenario: '',
  multiTurnRounds: 3,
  multiTurnRoleA: '',
  multiTurnRoleB: '',
  // 高级 Markdown 分块配置
  advancedPreserveHeadings: true,
  advancedTextSplitMinLength: 800,
  advancedTextSplitMaxLength: 2000,
  // 测试集生成配置
  evalQuestionTypeRatios: {
    true_false: 1,
    single_choice: 1,
    multiple_choice: 1,
    short_answer: 1,
    open_ended: 1
  }
};
