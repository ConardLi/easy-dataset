import { NextResponse } from 'next/server';
import LLMClient from '@/lib/llm/core/index';


export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    // 获取请求体
    const { model, messages } = await request.json();

    // 验证请求参数
    if (!model) {
      return NextResponse.json({ error: '模型参数不能为空' }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '消息列表不能为空' }, { status: 400 });
    }

    // 使用自定义的LLM客户端
    const llmClient = new LLMClient({
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
    });

    // 格式化消息历史
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 调用LLM API
    let response;
    try {
      // 如果是Ollama提供商，使用专门的API
      if (model.provider.toLowerCase() === 'ollama') {
        const ollamaHost = new URL(model.endpoint).hostname;
        const ollamaPort = new URL(model.endpoint).port || '11434';

        // 获取最后一条消息内容
        const lastMessage = formattedMessages[formattedMessages.length - 1];

        const ollama = new LLMClient({
          provider: 'ollama',
          endpoint: `http://${ollamaHost}:${ollamaPort}`,
          model: model.name
        });

        const result = await ollama.chat(lastMessage.content);
        response = result.message?.content || result.response || '无响应';

      } else {
        // 对于其他提供商，使用通用客户端
        const result = await llmClient.chat(formattedMessages);
        response = result.choices?.[0]?.message?.content ||
          result.response ||
          '无法解析模型响应';
      }
    } catch (error) {
      console.error('调用LLM API失败:', error);
      return NextResponse.json({
        error: `调用${model.provider}模型失败: ${error.message}`
      }, { status: 500 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('处理聊天请求出错:', error);
    return NextResponse.json({ error: `处理请求失败: ${error.message}` }, { status: 500 });
  }
}
