import { NextResponse } from 'next/server';
import { getLlmProviders } from '@/lib/db/llm-providers';

// 获取 LLM 提供商数据
export async function GET() {
  try {
    const result = await getLlmProviders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
