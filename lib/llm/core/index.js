/**
 * LLM API 统一调用工具类
 * 支持多种模型提供商：OpenAI、Ollama、智谱AI等
 * 支持普通输出和流式输出
 */
import { DEFAULT_MODEL_SETTINGS } from '@/constant/model';
import { extractThinkChain, extractAnswer } from '@/lib/llm/common/util';
import { logLlmUsage, createLatencyTimer, extractTokenUsage } from '@/lib/llm/usageLogger';
const OllamaClient = require('./providers/ollama'); // 导入 OllamaClient
const OpenAIClient = require('./providers/openai'); // 导入 OpenAIClient
const ZhiPuClient = require('./providers/zhipu'); // 导入 ZhiPuClient
const OpenRouterClient = require('./providers/openrouter');
const AlibailianClient = require('./providers/alibailian'); // 导入 AlibailianClient

function normalizeLlmText(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeLlmText(item)).filter(Boolean).join('');
  }

  if (typeof value === 'object') {
    if (typeof value.text === 'string') {
      return value.text;
    }

    if (typeof value.content === 'string') {
      return value.content;
    }

    if (Array.isArray(value.content)) {
      return normalizeLlmText(value.content);
    }

    if (Array.isArray(value.parts)) {
      return normalizeLlmText(value.parts);
    }

    if (typeof value.reasoningText === 'string') {
      return value.reasoningText;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

class LLMClient {
  /**
   * 创建 LLM 客户端实例
   * @param {Object} config - 配置信息
   * @param {string} config.provider - 提供商名称，如 'openai', 'ollama', 'zhipu' 等
   * @param {string} config.endpoint - API 端点，如 'https://api.openai.com/v1/'
   * @param {string} config.apiKey - API 密钥（如果需要）
   * @param {string} config.model - 模型名称，如 'gpt-3.5-turbo', 'llama2' 等
   * @param {number} config.temperature - 温度参数
   * @param {string} [config.projectId] - 项目 ID（用于统计上报，可选）
   */
  constructor(config = {}) {
    // 保存 projectId 用于统计上报
    this.projectId = config.projectId || null;
    this.config = {
      provider: config.providerId || 'openai',
      endpoint: this._handleEndpoint(config.providerId, config.endpoint) || '',
      apiKey: config.apiKey || '',
      model: config.modelId || config.modelName,
      temperature: config.temperature || DEFAULT_MODEL_SETTINGS.temperature,
      maxTokens: config.maxTokens || DEFAULT_MODEL_SETTINGS.maxTokens,
      max_tokens: config.maxTokens || DEFAULT_MODEL_SETTINGS.maxTokens,
      topP: config.topP !== undefined ? config.topP : DEFAULT_MODEL_SETTINGS.topP,
      top_p: config.topP !== undefined ? config.topP : DEFAULT_MODEL_SETTINGS.topP
    };
    if (config.topK !== undefined && config.topK !== 0) {
      this.config.topK = config.topK;
    }

    this.client = this._createClient(this.config.provider, this.config);
  }

  /**
   * 兼容之前版本的用户配置
   */
  _handleEndpoint(provider, endpoint) {
    const providerId = String(provider || '').toLowerCase();
    let normalizedEndpoint = String(endpoint || '').trim();

    if (!normalizedEndpoint) {
      return '';
    }

    // 兼容误配的智谱 coding endpoint（会导致 chat/completions 返回 404）
    if (providerId === 'ollama') {
      if (normalizedEndpoint.endsWith('v1/') || normalizedEndpoint.endsWith('v1')) {
        return normalizedEndpoint.replace(/v1\/?$/, 'api');
      }
    }
    if (normalizedEndpoint.includes('/chat/completions')) {
      return normalizedEndpoint.replace('/chat/completions', '');
    }
    return normalizedEndpoint;
  }

  _createClient(provider, config) {
    const clientMap = {
      ollama: OllamaClient,
      openai: OpenAIClient,
      siliconflow: OpenAIClient,
      deepseek: OpenAIClient,
      zhipu: ZhiPuClient,
      openrouter: OpenRouterClient,
      alibailian: AlibailianClient
    };
    const providerId = String(provider || '').toLowerCase();
    // custom provider 且 endpoint 指向智谱时，优先使用 zhipu 客户端
    if (providerId === 'custom' && String(config.endpoint || '').includes('open.bigmodel.cn')) {
      return new ZhiPuClient(config);
    }

    const ClientClass = clientMap[providerId] || OpenAIClient;
    return new ClientClass(config);
  }

  /**
   * 设置当前调用的项目 ID（用于统计上报）
   * @param {string} projectId - 项目 ID
   * @returns {LLMClient} 返回自身，支持链式调用
   */
  setProjectId(projectId) {
    this.projectId = projectId;
    return this;
  }

  async _callClientMethod(method, ...args) {
    const timer = createLatencyTimer();
    let response = null;
    let status = 'SUCCESS';
    let errorMessage = null;

    try {
      response = await this.client[method](...args);
      return response;
    } catch (error) {
      status = 'FAILED';
      errorMessage = error.message || String(error);
      console.error(`${this.config.provider} API 调用出错:`, error);
      throw error;
    } finally {
      // 异步上报统计信息（不阻塞主流程）
      // 仅对非流式方法进行 Token 统计（流式方法无法直接获取 Token 数）
      const isStreamMethod = method === 'chatStream' || method === 'chatStreamAPI';
      const { inputTokens, outputTokens } =
        !isStreamMethod && response ? extractTokenUsage(response) : { inputTokens: 0, outputTokens: 0 };

      logLlmUsage({
        projectId: this.projectId || 'unknown',
        provider: this.config.provider,
        model: this.config.model,
        inputTokens,
        outputTokens,
        latency: timer.getLatency(),
        status,
        errorMessage
      });
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
  /**
   * 纯API流式生成对话响应
   * @param {string|Array} prompt - 用户输入的提示词或对话历史
   * @param {Object} options - 可选参数
   * @returns {Response} 返回原生Response对象
   */
  async chatStreamAPI(prompt, options = {}) {
    const messages = Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }];
    options = {
      ...options,
      ...this.config
    };
    return this._callClientMethod('chatStreamAPI', messages, options);
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
    return normalizeLlmText(llmRes.text || llmRes.response?.messages || '');
  }

  // 提取答案和思维链
  extractAnswerAndCOT(llmRes) {
    let answer = normalizeLlmText(llmRes?.text || '');
    let cot = normalizeLlmText(llmRes?.reasoning || '');
    if ((answer && answer.startsWith('<think>')) || answer.startsWith('<thinking>')) {
      cot = extractThinkChain(answer);
      answer = extractAnswer(answer);
    } else if (
      llmRes?.response?.body?.choices?.length > 0 &&
      llmRes.response.body.choices[0].message.reasoning_content
    ) {
      if (llmRes.response.body.choices[0].message.reasoning_content) {
        cot = normalizeLlmText(llmRes.response.body.choices[0].message.reasoning_content);
      }
      if (llmRes.response.body.choices[0].message.content) {
        answer = normalizeLlmText(llmRes.response.body.choices[0].message.content);
      }
    }
    if (answer.startsWith('\n\n')) {
      answer = answer.slice(2);
    }
    if (cot.endsWith('\n\n')) {
      cot = cot.slice(0, -2);
    }
    return { answer, cot };
  }

  async getResponseWithCOT(prompt, options = {}) {
    const llmRes = await this.chat(prompt, options);
    return this.extractAnswerAndCOT(llmRes);
  }

  /**
   * 视觉模型响应（处理图片和文本）
   * @param {string} prompt - 提示词/问题
   * @param {string} base64Image - base64 编码的图片数据
   * @param {string|Object} mimeTypeOrOptions - MIME 类型或可选参数对象
   * @param {Object} options - 可选参数（当第三个参数是 mimeType 时使用）
   * @returns {Promise<Object>} 返回模型响应
   */
  async getVisionResponse(prompt, base64Image, mimeType = 'image/jpeg') {
    // 构建包含图片的消息
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ];
    const llmRes = await this._callClientMethod('chat', messages, {});
    return this.extractAnswerAndCOT(llmRes);
  }
}

module.exports = LLMClient;
