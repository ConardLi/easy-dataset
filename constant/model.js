
export const MODEL_PROVIDERS = [
    {
        id: 'ollama',
        name: 'Ollama',
        defaultEndpoint: 'http://127.0.0.1:11434/v1/',
        defaultModels: []
    },
    {
        id: 'openai',
        name: 'OpenAI',
        defaultEndpoint: 'https://api.openai.com/v1/',
        defaultModels: ['GPT-4o', 'GPT-4o-mini', 'o1-mini']
    },
    {
        id: 'siliconflow',
        name: '硅基流动',
        defaultEndpoint: 'https://api.siliconflow.cn/v1/',
        defaultModels: ['deepseek-ai/DeepSeek-R1', 'Qwen2.5-7B-Instruct']
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        defaultEndpoint: 'https://api.deepseek.com/v1/',
        defaultModels: ['deepseek-chat', 'deepseek-reasoner']
    },
    {
        id: '302ai',
        name: '302.AI',
        defaultEndpoint: 'https://api.302.ai/v1/',
        defaultModels: ['Doubao-pro-128k', 'deepseek-r1', 'kimi-latest', 'qwen-max']
    },
    {
        id: 'zhipu',
        name: '智谱AI',
        defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4/',
        defaultModels: ['GLM-4-Flash', 'GLM-4']
    }, {
        id: 'huoshan',
        name: '火山引擎',
        defaultEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/',
        defaultModels: []
    }, {
        id: 'groq',
        name: 'Groq',
        defaultEndpoint: 'https://api.groq.com/openai',
        defaultModels: ['Gemma 7B', 'LLaMA3 8B', 'LLaMA3 70B']
    }, {
        id: 'grok',
        name: 'Grok',
        defaultEndpoint: 'https://api.x.ai',
        defaultModels: ['Grok Beta']
    }
];