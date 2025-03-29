import { NextResponse } from 'next/server';
import OllamaAPI from '@/lib/llm/core/ollama';

// 设置为强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 从查询参数中获取 host 和 port
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host') || '127.0.0.1';
    const port = searchParams.get('port') || '11434';

    // 创建 Ollama API 实例
    const ollama = new OllamaAPI({
      host: host,
      port: parseInt(port, 10)
    });

    // 获取模型列表
    const models = await ollama.getModels();

    return NextResponse.json(models);
  } catch (error) {
    console.error('fetch Ollama models error:', error);
    return NextResponse.json({ error: 'fetch Models failed' }, { status: 500 });
  }
}
