import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import BaseClient from './base.js';

/**
 * 阿里百炼 Provider
 * 使用 createOpenAICompatible 来支持 providerOptions
 * 参考: https://github.com/vercel/ai/issues/6037
 */
class AlibailianClient extends BaseClient {
  constructor(config) {
    super(config);
    // 使用 createOpenAICompatible，name 必须设置为 'qwen' 才能使 providerOptions.qwen 生效
    this.qwen = createOpenAICompatible({
      name: 'qwen',
      apiKey: this.apiKey,
      baseURL: this.endpoint
    });
  }

  _getModel() {
    return this.qwen(this.model);
  }

  /**
   * 重写 chat 方法，直接调用阿里百炼 API
   * 支持 enable_thinking 参数和视觉模型
   */
  async chat(messages, options = {}) {
    // 转换消息格式，保持标准 OpenAI 格式（支持视觉模型）
    const formattedMessages = this._formatMessagesForVision(messages);

    // 构建请求体
    const requestBody = {
      model: this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? this.modelConfig.temperature,
      top_p: options.topP !== undefined ? options.topP : options.top_p || this.modelConfig.top_p,
      max_tokens: options.max_tokens || this.modelConfig.max_tokens,
      enable_thinking: options.enable_thinking !== undefined ? options.enable_thinking : false
    };

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: options.abortSignal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw Object.assign(new Error(`阿里百炼 API 调用失败: ${response.status} ${errorText}`), { statusCode: response.status });
      }

      const data = await response.json();

      // 转换为 AI SDK 格式
      return {
        text: data.choices[0]?.message?.content || '',
        finishReason: data.choices[0]?.finish_reason || 'stop',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      if (!options.privateEvaluation) console.error('阿里百炼 API 调用错误:', error);
      throw error;
    }
  }

  /**
   * 重写 _convertJson 方法，支持视觉模型
   * 覆盖父类方法，保持标准 OpenAI 格式
   */
  _convertJson(messages) {
    return this._formatMessagesForVision(messages);
  }

  /**
   * 格式化消息，支持视觉模型的图片内容
   * 保持标准 OpenAI 格式，不使用 experimental_attachments
   */
  _formatMessagesForVision(messages) {
    return messages.map(msg => {
      // 非 user 角色直接返回
      if (msg.role !== 'user') {
        return {
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        };
      }

      // 处理 user 消息
      // 如果 content 是字符串，直接返回
      if (typeof msg.content === 'string') {
        return {
          role: 'user',
          content: msg.content
        };
      }

      // 如果 content 是数组（包含文本和图片），保持标准 OpenAI 格式
      if (Array.isArray(msg.content)) {
        const formattedContent = msg.content.map(item => {
          if (item.type === 'text') {
            return {
              type: 'text',
              text: item.text
            };
          } else if (item.type === 'image_url') {
            return {
              type: 'image_url',
              image_url: {
                url: item.image_url.url
              }
            };
          }
          return item;
        });

        return {
          role: 'user',
          content: formattedContent
        };
      }

      // 默认情况
      return msg;
    });
  }
}

module.exports = AlibailianClient;
