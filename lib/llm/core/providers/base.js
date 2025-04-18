import { generateText, streamText } from 'ai';

class BaseClient {
  constructor(config) {
    this.endpoint = config.endpoint || '';
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.modelConfig = {
      temperature: config.temperature || 0.7,
      top_p: config.top_p || 0.9,
      max_tokens: config.max_tokens || 8192
    };
  }

  /**
   * chat（普通输出）
   */
  async chat(messages, options) {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    const model = this._getModel();
    return await generateText({
      model,
      prompt,
      temperature: options.temperature || this.modelConfig.temperature,
      topP: options.top_p || this.modelConfig.top_p,
      maxTokens: options.max_tokens || this.modelConfig.max_tokens
    });
  }

  /**
   * chat（流式输出）
   */
  async chatStream(messages, options) {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    const model = this._getModel();
    const stream = streamText({
      model,
      prompt,
      temperature: options.temperature || this.modelConfig.temperature,
      topP: options.top_p || this.modelConfig.top_p,
      maxTokens: options.max_tokens || this.modelConfig.max_tokens
    });
    return stream.toTextStreamResponse();
  }

  // 抽象方法
  _getModel() {
    throw new Error('_getModel 子类方法必须实现');
  }
}

module.exports = BaseClient;
