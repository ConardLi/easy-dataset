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
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    // 创建 LLM 客户端
    const llmClient = new LLMClient({
      providerId: model.providerId,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
    });
    
    // 格式化消息历史
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    try {
      // 调用流式 API
      const stream = await llmClient.chatStream(formattedMessages);
      
      // 返回流式响应
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error) {
      console.error('调用 LLM API 失败:', error);
      return NextResponse.json({ 
        error: `调用${model.provider}模型失败: ${error.message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('处理流式聊天请求出错:', error);
    return NextResponse.json({ error: `处理请求失败: ${error.message}` }, { status: 500 });
  }
}
