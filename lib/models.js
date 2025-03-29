'use server';

// 大模型调用封装

// 统一的模型调用接口
export async function callModel({ provider, model, endpoint, apiKey, messages, temperature = 0.7, maxTokens = 4096 }) {
  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        return await callOpenAI({
          model,
          endpoint,
          apiKey,
          messages,
          temperature,
          maxTokens
        });
      case 'ollama':
        return await callOllama({
          model,
          endpoint,
          messages,
          temperature
        });
      case '智谱ai':
      case 'zhipuai':
        return await callZhipuAI({
          model,
          endpoint,
          apiKey,
          messages,
          temperature,
          maxTokens
        });
      case '硅基流动':
      case 'guijitech':
        return await callGuijiTech({
          model,
          endpoint,
          apiKey,
          messages,
          temperature,
          maxTokens
        });
      default:
        throw new Error(`不支持的模型提供商: ${provider}`);
    }
  } catch (error) {
    console.error('模型调用失败:', error);
    throw error;
  }
}

// OpenAI 模型调用
async function callOpenAI({ model, endpoint = 'https://api.openai.com/v1', apiKey, messages, temperature, maxTokens }) {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API 错误: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    provider: 'OpenAI'
  };
}

// Ollama 模型调用
async function callOllama({ model, endpoint = 'http://127.0.0.1:11434', messages, temperature }) {
  // 将 messages 转换为 Ollama 的格式
  const formattedMessages = messages.map(msg => {
    if (msg.role === 'system') {
      return { role: 'system', content: msg.content };
    } else if (msg.role === 'user') {
      return { role: 'user', content: msg.content };
    } else if (msg.role === 'assistant') {
      return { role: 'assistant', content: msg.content };
    }
    return msg;
  });

  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API 错误: ${error || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.message?.content || '',
    usage: { input_tokens: 0, output_tokens: 0 }, // Ollama 不提供 token 使用信息
    provider: 'Ollama'
  };
}

// 智谱 AI 模型调用
async function callZhipuAI({
  model,
  endpoint = 'https://open.bigmodel.cn/api/paas/v4',
  apiKey,
  messages,
  temperature,
  maxTokens
}) {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`智谱 AI API 错误: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    provider: '智谱AI'
  };
}

// 硅基流动模型调用
async function callGuijiTech({
  model,
  endpoint = 'https://api.guijitech.com/v1',
  apiKey,
  messages,
  temperature,
  maxTokens
}) {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`硅基流动 API 错误: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    provider: '硅基流动'
  };
}
