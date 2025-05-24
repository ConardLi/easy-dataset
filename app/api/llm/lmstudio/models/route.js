import { NextResponse } from 'next/server';
const LMStudioClient = require('@/lib/llm/core/providers/lmstudio');

// 设置为强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 从查询参数中获取 host 和 port
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host') || '127.0.0.1';
    const port = searchParams.get('port') || '1234';

    // 创建 LMStudio API 实例
    const lmstudio = new LMStudioClient({
      endpoint: `http://${host}:${port}/api`
    });
    // 获取模型列表
    const models = await lmstudio.getModels();
    return NextResponse.json(models);
  } catch (error) {
    return NextResponse.json({ error: 'fetch Models failed' }, { status: 500 });
  }
} 