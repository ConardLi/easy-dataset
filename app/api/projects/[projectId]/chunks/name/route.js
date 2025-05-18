import { NextResponse } from 'next/server';
import { getChunkByName } from '@/lib/db/chunks';

/**
 * 根据文本块名称获取文本块
 * @param {Request} request 请求对象
 * @param {object} context 上下文，包含路径参数
 * @returns {Promise<NextResponse>} 响应对象
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 从查询参数中获取 chunkName
    const { searchParams } = new URL(request.url);
    const chunkName = searchParams.get('chunkName');

    if (!chunkName) {
      return NextResponse.json({ error: '文本块名称不能为空' }, { status: 400 });
    }

    // 根据名称和项目ID查询文本块
    const chunk = await getChunkByName(projectId, chunkName);

    if (!chunk) {
      return NextResponse.json({ error: '未找到指定的文本块' }, { status: 404 });
    }

    // 返回文本块信息
    return NextResponse.json(chunk);
  } catch (error) {
    console.error('根据名称获取文本块失败:', error);
    return NextResponse.json({ error: '获取文本块失败: ' + error.message }, { status: 500 });
  }
}
