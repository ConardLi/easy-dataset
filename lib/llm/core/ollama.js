/**
 * Ollama API 调用工具类
 */
const http = require('http');

class OllamaAPI {
  constructor(config = {}) {
    this.host = config.host || '127.0.0.1';
    this.port = config.port || 11434;
    this.model = config.model || 'llama2';
    this.baseUrl = `http://${this.host}:${this.port}`;
  }

  /**
   * 获取本地可用的模型列表
   * @returns {Promise<Array>} 返回模型列表
   */
  async getModels() {
    try {
      const response = await this._makeRequest('/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 处理响应，提取模型名称
      if (response && response.models) {
        return response.models.map(model => ({
          name: model.name,
          modified_at: model.modified_at,
          size: model.size
        }));
      }

      return [];
    } catch (error) {
      console.error('获取 Ollama 模型列表出错:', error);
      throw error;
    }
  }

  /**
   * 生成对话响应
   * @param {string} prompt - 用户输入的提示词
   * @param {Object} options - 可选参数
   * @param {number} options.temperature - 温度参数(0-1)
   * @param {number} options.topP - top_p参数(0-1)
   * @param {number} options.topK - top_k参数
   * @param {boolean} options.stream - 是否使用流式响应
   * @returns {Promise<Object>} 返回模型响应
   */
  async chat(prompt, options = {}) {
    const defaultOptions = {
      model: this.model,
      prompt: prompt,
      stream: false,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 4096,
      max_tokens: 8192
    };

    const requestOptions = {
      ...defaultOptions,
      ...options
    };

    try {
      const response = await this._makeRequest('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestOptions)
      });

      return response;
    } catch (error) {
      console.error('Ollama API 调用出错:', error);
      throw error;
    }
  }

  /**
   * 流式生成对话响应
   * @param {string} prompt - 用户输入的提示词
   * @param {function} onData - 处理每个数据块的回调函数
   * @param {Object} options - 可选参数
   */
  async chatStream(prompt, onData, options = {}) {
    const requestOptions = {
      ...options,
      model: this.model,
      prompt: prompt,
      stream: true
    };

    try {
      return await this._makeStreamRequest(
        '/api/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestOptions)
        },
        onData
      );
    } catch (error) {
      console.error('Ollama 流式API调用出错:', error);
      throw error;
    }
  }

  /**
   * 发送HTTP请求
   * @private
   */
  _makeRequest(path, options) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: options.method,
        headers: options.headers
      };

      const req = http.request(requestOptions, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('响应解析失败'));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  /**
   * 发送流式HTTP请求
   * @private
   */
  _makeStreamRequest(path, options, onData) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: options.method,
        headers: options.headers
      };

      const req = http.request(requestOptions, res => {
        res.on('data', chunk => {
          try {
            const data = JSON.parse(chunk);
            onData(data);
          } catch (error) {
            console.error('数据块解析失败:', error);
          }
        });

        res.on('end', () => {
          resolve();
        });
      });

      req.on('error', error => {
        reject(error);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }
}

module.exports = OllamaAPI;
