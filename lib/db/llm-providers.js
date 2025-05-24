'use server';
import { db } from '@/lib/db/index';

export async function getLlmProviders() {
  try {
    let list = await db.llmProviders.findMany();
    if (list.length !== 0) {
      return list;
    }

    let data = [
      {
        id: 'ollama',
        name: 'Ollama',
        apiUrl: 'http://127.0.0.1:11434/api'
      },
      {
        id: 'openai',
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1/'
      },
      {
        id: 'siliconcloud',
        name: '硅基流动',
        apiUrl: 'https://api.siliconflow.cn/v1/'
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/v1/'
      },
      {
        id: '302ai',
        name: '302.AI',
        apiUrl: 'https://api.302.ai/v1/'
      },
      {
        id: 'zhipu',
        name: '智谱AI',
        apiUrl: 'https://open.bigmodel.cn/api/paas/v4/'
      },
      {
        id: 'Doubao',
        name: '火山引擎',
        apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/'
      },
      {
        id: 'groq',
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai'
      },
      {
        id: 'grok',
        name: 'Grok',
        apiUrl: 'https://api.x.ai'
      },
      {
        id: 'openRouter',
        name: 'OpenRouter',
        apiUrl: 'https://openrouter.ai/api/v1/'
      },
      {
        id: 'alibailian',
        name: '阿里云百炼',
        apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      },
      {
        id: 'lmstudio',
        name: 'LMStudio',
        apiUrl: 'http://127.0.0.1:1234/v1'
      }
    ];
    await db.llmProviders.createMany({ data });
    return data;
  } catch (error) {
    console.error('Failed to get llmProviders in database');
    throw error;
  }
}
