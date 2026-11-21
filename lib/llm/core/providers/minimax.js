import { createOpenAI } from '@ai-sdk/openai';
import BaseClient from './base.js';

/**
 * MiniMax Provider
 * Uses the OpenAI-compatible API at https://api.minimax.io/v1
 * Temperature must be in (0.0, 1.0] — zero is rejected by the API.
 */
class MiniMaxClient extends BaseClient {
  constructor(config) {
    super(config);
    // Clamp temperature: MiniMax requires (0.0, 1.0]
    if (this.modelConfig.temperature <= 0) {
      this.modelConfig.temperature = 0.01;
    } else if (this.modelConfig.temperature > 1) {
      this.modelConfig.temperature = 1.0;
    }
    this.openai = createOpenAI({
      baseURL: this.endpoint || 'https://api.minimax.io/v1',
      apiKey: this.apiKey
    });
  }

  _getModel() {
    return this.openai(this.model);
  }

  /**
   * Override chat to enforce MiniMax temperature constraint.
   */
  async chat(messages, options) {
    // Clamp temperature for each request
    let temperature = options.temperature ?? this.modelConfig.temperature;
    if (temperature <= 0) temperature = 0.01;
    if (temperature > 1) temperature = 1.0;
    return super.chat(messages, { ...options, temperature });
  }

  /**
   * Override chatStream to enforce MiniMax temperature constraint.
   */
  async chatStream(messages, options) {
    let temperature = options.temperature || this.modelConfig.temperature;
    if (temperature <= 0) temperature = 0.01;
    if (temperature > 1) temperature = 1.0;
    return super.chatStream(messages, { ...options, temperature });
  }

  /**
   * Override chatStreamAPI to enforce MiniMax temperature constraint.
   */
  async chatStreamAPI(messages, options) {
    let temperature = options.temperature || this.modelConfig.temperature;
    if (temperature <= 0) temperature = 0.01;
    if (temperature > 1) temperature = 1.0;
    return super.chatStreamAPI(messages, { ...options, temperature });
  }
}

module.exports = MiniMaxClient;
