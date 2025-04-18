import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  try {
    let a = await db.llmProviders.createMany({
      data: [
        {
          id: 'ollama',
          name: 'Ollama',
          apiKey: '',
          apiUrl: 'http://127.0.0.1:11434/api',
          status: 0
        },
        {
          id: 'openai',
          name: 'OpenAI',
          apiKey: '',
          apiUrl: 'https://api.openai.com/v1/',
          status: 0
        },
        {
          id: 'siliconflow',
          name: '硅基流动',
          apiKey: '',
          apiUrl: 'https://api.siliconflow.cn/v1/',
          status: 0
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          apiKey: '',
          apiUrl: 'https://api.deepseek.com/v1/',
          status: 0
        },
        {
          id: '302ai',
          name: '302.AI',
          apiKey: '',
          apiUrl: 'https://api.302.ai/v1/',
          status: 0
        },
        {
          id: 'zhipu',
          name: '智谱AI',
          apiKey: '',
          apiUrl: 'https://open.bigmodel.cn/api/paas/v4/',
          status: 0
        },
        {
          id: 'huoshan',
          name: '火山引擎',
          apiKey: '',
          apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/',
          status: 0
        },
        {
          id: 'groq',
          name: 'Groq',
          apiKey: '',
          apiUrl: 'https://api.groq.com/openai',
          status: 0
        },
        {
          id: 'grok',
          name: 'Grok',
          apiKey: '',
          apiUrl: 'https://api.x.ai',
          status: 0
        },
        {
          id: 'OpenRouter',
          name: 'OpenRouter',
          apiKey: '',
          apiUrl: 'https://openrouter.ai/api/v1/',
          status: 0
        },
        {
          id: 'alibailian',
          name: '阿里云百炼',
          apiKey: '',
          apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          status: 0
        }
      ]
    });
    console.log(a);
  } catch (e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}

main();
