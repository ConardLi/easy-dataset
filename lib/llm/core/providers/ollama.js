import { createOllama } from 'ollama-ai-provider';
import BaseClient from './base.js';

class OllamaClient extends BaseClient {
  constructor(config) {
    super(config);
    this.ollama = createOllama({
      baseURL: this.endpoint,
      apiKey: this.apiKey
    });
  }

  _getModel() {
    return this.ollama(this.model);
  }

  /**
   * 获取本地可用的模型列表
   * @returns {Promise<Array>} 返回模型列表
   */
  async getModels() {
    try {
      const response = await fetch(this.endpoint + '/tags');
      const data = await response.json();
      // 处理响应，提取模型名称
      if (data && data.models) {
        return data.models.map(model => ({
          name: model.name,
          modified_at: model.modified_at,
          size: model.size
        }));
      }
      return [];
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  async chatStreamAPI(messages, options) {
    const model = this._getModel();
    // 修复 modelName 获取逻辑：如果 model 是函数但没有 modelName 属性，使用 this.model
    const modelName = typeof model === 'function' && model.modelName ? model.modelName : this.model;

    // 转换消息格式为标准 API 格式（Ollama 使用标准格式）
    const formattedMessages = messages.map(msg => {
      // 确保所有消息都是标准格式
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content
        };
      } else if (Array.isArray(msg.content)) {
        // 对于包含图片的复合消息，保持数组格式
        return {
          role: msg.role,
          content: msg.content
        };
      } else {
        // 如果 content 格式不正确，转换为字符串
        return {
          role: msg.role,
          content: String(msg.content || '')
        };
      }
    });

    // 构建符合 Ollama API 的请求数据
    const payload = {
      model: modelName,
      messages: formattedMessages,
      stream: true, // 开启流式输出
      options: {
        temperature: options.temperature || this.modelConfig.temperature,
        top_p: options.top_p || this.modelConfig.top_p,
        num_predict: options.max_tokens || this.modelConfig.max_tokens
      }
    };

    if (this.endpoint.endsWith('/api')) {
      this.endpoint = this.endpoint.slice(0, -4);
    }

    try {
      // 发起流式请求
      const response = await fetch(`${this.endpoint.endsWith('/') ? this.endpoint : `${this.endpoint}/`}api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

            // 如果正在输出思维链，需要先关闭思维链标签
            if (isThinking) {
              controller.enqueue(encoder.encode('</think>'));
              isThinking = false;
            }

            controller.enqueue(encoder.encode(text));
          };

          // 流式输出思维链
          const sendReasoning = text => {
            if (!text) return;

            // 如果还没有开始思维链输出，需要先添加思维链标签
            if (!isThinking) {
              controller.enqueue(encoder.encode('<think>'));
              isThinking = true;
            }

            controller.enqueue(encoder.encode(text));
          };

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // 流结束时，如果还在思维链模式，关闭标签
                if (isThinking) {
                  controller.enqueue(encoder.encode('</think>'));
                }
                controller.close();
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

                if (line) {
                  try {
                    // 解析JSON数据
                    const jsonData = JSON.parse(line);
                    const deltaContent = jsonData.message?.content;
                    const deltaReasoning = jsonData.message?.thinking;

                    // 如果有思维链内容，则实时流式输出
                    if (deltaReasoning) {
                      sendReasoning(deltaReasoning);
                    }

                    // 如果有正文内容也实时输出
                    if (deltaContent !== undefined && deltaContent !== null) {
                      sendContent(deltaContent);
                    }
                  } catch (e) {
                    // 忽略 JSON 解析错误
                    console.error('解析响应数据出错:', e);
                  }
                }

                boundary = buffer.indexOf('\n');
              }
            }
          } catch (error) {
            console.error('处理数据流时出错:', error);
            // 如果出错时正在输出思维链，要关闭思维链标签
            if (isThinking) {
              try {
                controller.enqueue(encoder.encode('</think>'));
              } catch (e) {
                console.error('关闭思维链标签出错:', e);
              }
            }
            controller.error(error);
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
}

module.exports = OllamaClient;
