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
      response = await llmClient.chat(formattedMessages);
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
