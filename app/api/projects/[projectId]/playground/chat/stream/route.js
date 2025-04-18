import { NextResponse } from 'next/server';
import LLMClient from '@/lib/llm/core/index';

/**
 * 流式输出的聊天接口
 */
export async function POST(request, { params }) {
  const { projectId } = params;

  try {
    const body = await request.json();
    const { model, messages } = body;

    if (!model || !messages) {
      return NextResponse.json({ error: 'Missing necessary parameters' }, { status: 400 });
    }

    // 创建 LLM 客户端
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

    try {
      // 调用流式 API
      const stream = await llmClient.chatStream(formattedMessages);
      // 返回流式响应
      return stream;
    } catch (error) {
      console.error('Failed to call LLM API:', error);
      return NextResponse.json(
        {
          error: `Failed to call ${model.provider} model: ${error.message}`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to process stream chat request:', error);
    return NextResponse.json({ error: `Failed to process stream chat request: ${error.message}` }, { status: 500 });
  }
}
