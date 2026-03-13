import { generateText, streamText } from 'ai';

function isOfficialOpenAIEndpoint(endpoint = '') {
  const normalizedEndpoint = String(endpoint || '').trim().toLowerCase();

  if (!normalizedEndpoint) {
    return false;
  }

  try {
    const { hostname } = new URL(normalizedEndpoint);
    return hostname === 'api.openai.com' || hostname.endsWith('.openai.com');
  } catch {
    return normalizedEndpoint.includes('api.openai.com');
  }
}

function checkOpenAIModel(endpoint, model) {
  if (!isOfficialOpenAIEndpoint(endpoint)) {
    return false;
  }

  const normalizedModel = String(model || '');
  return ['gpt-5', 'gpt-4', 'o1'].find(m => normalizedModel.startsWith(m));
}

function resolveModelId(model, fallbackModel) {
  if (typeof model === 'function') {
    return String(model.modelId || model.modelName || fallbackModel || '');
  }

  if (model && typeof model === 'object') {
    return String(model.modelId || model.modelName || fallbackModel || '');
  }

  return String(fallbackModel || '');
}

class BaseClient {
  constructor(config) {
    this.endpoint = config.endpoint || '';
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.provider = config.provider || '';
    this.modelConfig = {
      temperature: config.temperature || 0.7,
      top_p: config.top_p !== undefined ? config.top_p : config.topP !== undefined ? config.topP : 0.9,
      max_tokens: config.max_tokens || 8192
    };
  }

  /**
   * chat（普通输出）
   */
  async chat(messages, options) {
    const model = this._getModel();
    const isOpenAIModel = checkOpenAIModel(this.endpoint, this.model);
    const maxTokens = options.max_tokens || this.modelConfig.max_tokens;
    const result = await generateText({
      model,
      messages: this._convertJson(messages),
      ...(isOpenAIModel
        ? { maxCompletionTokens: maxTokens, temperature: 1 }
        : {
            maxTokens,
            temperature: options.temperature || this.modelConfig.temperature,
            topP: options.topP !== undefined ? options.topP : options.top_p || this.modelConfig.top_p
          })
    });
    return result;
  }

  /**
   * chat（流式输出）
   */
  async chatStream(messages, options) {
    const model = this._getModel();
    const isOpenAIModel = checkOpenAIModel(this.endpoint, this.model);
    const maxTokens = options.max_tokens || this.modelConfig.max_tokens;
    const stream = streamText({
      model,
      messages: this._convertJson(messages),
      ...(isOpenAIModel
        ? { maxCompletionTokens: maxTokens, temperature: 1 }
        : {
            maxTokens,
            temperature: options.temperature || this.modelConfig.temperature,
            topP: options.topP !== undefined ? options.topP : options.top_p || this.modelConfig.top_p
          })
    });
    return stream.toTextStreamResponse();
  }

  // 抽象方法
  _getModel() {
    throw new Error('_getModel 子类方法必须实现');
  }

  /**
   * chat（纯API流式输出）
   */
  async chatStreamAPI(messages, options) {
    const model = this._getModel();
    const modelName = resolveModelId(model, this.model);
    const isOpenAIModel = checkOpenAIModel(this.endpoint, this.model);
    const maxTokens = options.max_tokens || this.modelConfig.max_tokens;
    const payload = {
      model: modelName,
      messages: this._convertJson(messages),
      ...(isOpenAIModel
        ? { max_completion_tokens: maxTokens, temperature: 1 }
        : {
            max_tokens: maxTokens,
            send_reasoning: true,
            reasoning: true,
            temperature: options.temperature || this.modelConfig.temperature,
            top_p: options.topP !== undefined ? options.topP : options.top_p || this.modelConfig.top_p
          }),
      stream: true // 开启流式输出
    };

    try {
      // 发起流式请求
      const endpoint = String(this.endpoint || '').trim();
      const response = await fetch(`${endpoint.endsWith('/') ? endpoint : `${endpoint}/`}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      if (!response.body) {
        throw new Error('响应中没有可读取的数据流');
      }

      // 处理原始数据流，实现思维链的流式输出
      const reader = response.body.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // 创建一个新的可读流
      const newStream = new ReadableStream({
        async start(controller) {
          let buffer = '';
          let isThinking = false; // 当前是否在输出思维链模式
          let pendingReasoning = null; // 等待输出的思维链

          // 输出文本内容
          const sendContent = text => {
            if (!text) return;

            try {
              // 如果正在输出思维链，需要先关闭思维链标签
              if (isThinking) {
                controller.enqueue(encoder.encode('</think>'));
                isThinking = false;
              }

              controller.enqueue(encoder.encode(text));
            } catch (e) {
              // 忽略流已关闭或无效状态的错误
              if (e.code === 'ERR_INVALID_STATE' || e.message?.includes('closed')) return;
              // 其他错误只打印不抛出，避免中断整个请求流程
              console.warn('流式输出警告:', e.message);
            }
          };

          // 流式输出思维链
          const sendReasoning = text => {
            if (!text) return;

            try {
              // 如果还没有开始思维链输出，需要先添加思维链标签
              if (!isThinking) {
                controller.enqueue(encoder.encode('<think>'));
                isThinking = true;
              }

              controller.enqueue(encoder.encode(text));
            } catch (e) {
              // 忽略流已关闭或无效状态的错误
              if (e.code === 'ERR_INVALID_STATE' || e.message?.includes('closed')) return;
              console.warn('流式输出警告:', e.message);
            }
          };

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // 流结束时，如果还在思维链模式，关闭标签
                if (isThinking) {
                  try {
                    controller.enqueue(encoder.encode('</think>'));
                  } catch (e) {
                    /* ignore */
                  }
                }
                try {
                  controller.close();
                } catch (e) {
                  /* ignore */
                }
                break;
              }

              // 解析数据块
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // 处理数据行
              let boundary = buffer.indexOf('\n');
              while (boundary !== -1) {
                const line = buffer.substring(0, boundary).trim();
                buffer = buffer.substring(boundary + 1);

                if (line.startsWith('data:') && !line.includes('[DONE]')) {
                  try {
                    // 解析JSON数据
                    const jsonData = JSON.parse(line.substring(5).trim());
                    const deltaContent = jsonData.choices?.[0]?.delta?.content;
                    const deltaReasoning = jsonData.choices?.[0]?.delta?.reasoning_content;

                    // 如果有思维链内容，则实时流式输出
                    if (deltaReasoning) {
                      sendReasoning(deltaReasoning);
                    }

                    // 如果有正文内容也实时输出
                    if (deltaContent !== undefined && deltaContent !== null) {
                      sendContent(deltaContent);
                    }
                  } catch (e) {
                    // 忽略 JSON 解析错误，但不打印，避免日志刷屏
                  }
                } else if (line.includes('[DONE]')) {
                  // 数据流结束，如果还在思维链模式，需要关闭思维链标签
                  if (isThinking) {
                    try {
                      controller.enqueue(encoder.encode('</think>'));
                      isThinking = false;
                    } catch (e) {
                      // 忽略
                    }
                  }
                }

                boundary = buffer.indexOf('\n');
              }
            }
          } catch (error) {
            // 如果是流关闭导致的错误，直接忽略
            if (error.code === 'ERR_INVALID_STATE') {
              return;
            }
            console.error('处理数据流时出错:', error);
            // 如果出错时正在输出思维链，尝试关闭思维链标签
            if (isThinking) {
              try {
                controller.enqueue(encoder.encode('</think>'));
              } catch (e) {
                // 忽略错误
              }
            }
            try {
              controller.error(error);
            } catch (e) {
              // 忽略错误
            }
          }
        }
      });

      // 最终返回响应流
      return new Response(newStream, {
        headers: {
          'Content-Type': 'text/plain', // 纯文本格式
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      });
    } catch (error) {
      console.error('流式API调用出错:', error);
      throw error;
    }
  }

  _convertJson(data) {
    return data.map(item => {
      // 只处理 role 为 "user" 的项
      if (item.role !== 'user') return item;

      const newItem = {
        role: 'user',
        content: '',
        experimental_attachments: [],
        parts: []
      };

      // 情况1：content 是字符串
      if (typeof item.content === 'string') {
        newItem.content = item.content;
        newItem.parts.push({
          type: 'text',
          text: item.content
        });
      }
      // 情况2：content 是数组
      else if (Array.isArray(item.content)) {
        item.content.forEach(contentItem => {
          if (contentItem.type === 'text') {
            // 文本内容
            newItem.content = contentItem.text;
            newItem.parts.push({
              type: 'text',
              text: contentItem.text
            });
          } else if (contentItem.type === 'image_url') {
            // 图片内容
            const imageUrl = contentItem.image_url.url;

            // 提取文件名（如果没有则使用默认名）
            let fileName = 'image.jpg';
            if (imageUrl.startsWith('data:')) {
              // 如果是 base64 数据，尝试从 content type 获取扩展名
              const match = imageUrl.match(/^data:image\/(\w+);base64/);
              if (match) {
                fileName = `image.${match[1]}`;
              }
            }

            newItem.experimental_attachments.push({
              url: imageUrl,
              name: fileName,
              contentType: imageUrl.startsWith('data:') ? imageUrl.split(';')[0].replace('data:', '') : 'image/jpeg' // 默认为 jpeg
            });
          }
        });
      }

      return newItem;
    });
  }
}

module.exports = BaseClient;
