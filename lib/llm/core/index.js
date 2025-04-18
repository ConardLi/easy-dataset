/**
 * LLM API 统一调用工具类
 * 支持多种模型提供商：OpenAI、Ollama、智谱AI等
 * 支持普通输出和流式输出
 */
import { DEFAULT_MODEL_SETTINGS } from '@/constant/model';
import { extractThinkChain, extractAnswer } from '@/lib/llm/common/util';
const OllamaClient = require('./providers/ollama'); // 导入 OllamaClient
const OpenAIClient = require('./providers/openai'); // 导入 OpenAIClient
const ZhiPuClient = require('./providers/zhipu'); // 导入 ZhiPuClient
const OpenRouterClient = require('./providers/openrouter');

class LLMClient {
  /**
   * 创建 LLM 客户端实例
   * @param {Object} config - 配置信息
   * @param {string} config.provider - 提供商名称，如 'openai', 'ollama', 'zhipu' 等
   * @param {string} config.endpoint - API 端点，如 'https://api.openai.com/v1/'
   * @param {string} config.apiKey - API 密钥（如果需要）
   * @param {string} config.model - 模型名称，如 'gpt-3.5-turbo', 'llama2' 等
   * @param {number} config.temperature - 温度参数
   */
  constructor(config = {}) {
    this.config = {
      provider: config.providerId || 'openai',
      endpoint: this._handleEndpoint(config.providerId, config.endpoint) || '',
      apiKey: config.apiKey || '',
      model: config.modelName || '',
      temperature: config.temperature || DEFAULT_MODEL_SETTINGS.temperature,
      maxTokens: config.maxTokens || DEFAULT_MODEL_SETTINGS.maxTokens
    };
    if (config.topP !== 0) {
      this.config.topP = config.topP;
    }
    if (config.topK !== 0) {
      this.config.topK = config.topK;
    }

    this.client = this._createClient(this.config.provider, this.config);
  }

  /**
   * 兼容之前版本的用户配置
   */
  _handleEndpoint(provider, endpoint) {
    if (provider.toLowerCase() === 'ollama') {
      if (endpoint.endsWith('v1/') || endpoint.endsWith('v1')) {
        return endpoint.replace('v1', 'api');
      }
    }
    if (endpoint.includes('/chat/completions')) {
      return endpoint.replace('/chat/completions', '');
    }
    return endpoint;
  }

  _createClient(provider, config) {
    const clientMap = {
      ollama: OllamaClient,
      openai: OpenAIClient,
      siliconflow: OpenAIClient,
      deepseek: OpenAIClient,
      zhipu: ZhiPuClient,
      openrouter: OpenRouterClient
    };
    const ClientClass = clientMap[provider.toLowerCase()] || OpenAIClient;
    return new ClientClass(config);
  }

  async _callClientMethod(method, ...args) {
    try {
      return await this.client[method](...args);
    } catch (error) {
      console.error(`${this.config.provider} API 调用出错:`, error);
      throw error;
    }
  }

  /**
   * 生成对话响应
   * @param {string|Array} prompt - 用户输入的提示词或对话历史
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 返回模型响应
   */
  async chat(prompt, options = {}) {
    const messages = Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }];
    options = {
      ...options,
      ...this.config
    };
    return this._callClientMethod('chat', messages, options);
  }

  /**
   * 流式生成对话响应
   * @param {string|Array} prompt - 用户输入的提示词或对话历史
   * @param {Object} options - 可选参数
   * @returns {ReadableStream} 返回可读流
   */
  async chatStream(prompt, options = {}) {
    const messages = Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }];
    options = {
      ...options,
      ...this.config
    };
    return this._callClientMethod('chatStream', messages, options);
  }

  // 获取模型响应
  async getResponse(prompt, options = {}) {
    const llmRes = await this.chat(prompt, options);
    return llmRes.text || llmRes.response.messages || '';
  }

  async getResponseWithCOT(prompt, options = {}) {
    const llmRes = await this.chat(prompt, options);
    let answer = llmRes.text || llmRes.response.messages || '';
    let cot = '';
    if (answer.startsWith('<think>') || answer.startsWith('<thinking>')) {
      cot = extractThinkChain(answer);
      answer = extractAnswer(answer);
    } else {
      cot = llmRes.text || llmRes.response.messages || '';
    }
    if (answer.startsWith('\n\n')) {
      answer = answer.slice(2);
    }
    if (cot.endsWith('\n\n')) {
      cot = cot.slice(0, -2);
    }
    return { answer, cot };
  }
}

module.exports = LLMClient;
