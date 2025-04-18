import { NextResponse } from 'next/server';
import LLMClient from '@/lib/llm/core/index';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取请求体
    const { model, messages } = await request.json();

    // 验证请求参数
    if (!model) {
      return NextResponse.json({ error: 'The model parameters cannot be empty' }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'The message list cannot be empty' }, { status: 400 });
    }

    // 使用自定义的LLM客户端
    const llmClient = new LLMClient(model);

    // 格式化消息历史
    const formattedMessages = messages.map(msg => {
      // 处理纯文本消息
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content
        };
      }
      // 处理包含图片的复合消息（用于视觉模型）
      else if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content
        };
      }
      // 默认情况
      return {
        role: msg.role,
        content: msg.content
      };
    });

    // 调用LLM API
    let response = '';
    try {
      response = await llmClient.getResponse(formattedMessages);
    } catch (error) {
      console.error('Failed to call LLM API:', error);
      return NextResponse.json(
        {
          error: `Failed to call ${model.provider} model: ${error.message}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Failed to process chat request:', error);
    return NextResponse.json({ error: `Failed to process chat request: ${error.message}` }, { status: 500 });
  }
}
