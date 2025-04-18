import { NextResponse } from 'next/server';
import { deleteChunkById, getChunkById, updateChunkById } from '@/lib/db/chunks';

// 获取文本块内容
export async function GET(request, { params }) {
  try {
    const { projectId, chunkId } = params;
    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }
    if (!chunkId) {
      return NextResponse.json({ error: 'Text block ID cannot be empty' }, { status: 400 });
    }
    // 获取文本块内容
    const chunk = await getChunkById(chunkId);

    return NextResponse.json(chunk);
  } catch (error) {
    console.error('Failed to get text block content:', error);
    return NextResponse.json({ error: error.message || 'Failed to get text block content' }, { status: 500 });
  }
}

// 删除文本块
export async function DELETE(request, { params }) {
  try {
    const { projectId, chunkId } = params;
    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }
    if (!chunkId) {
      return NextResponse.json({ error: 'Text block ID cannot be empty' }, { status: 400 });
    }
    await deleteChunkById(chunkId);

    return NextResponse.json({ message: 'Text block deleted successfully' });
  } catch (error) {
    console.error('Failed to delete text block:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete text block' }, { status: 500 });
  }
}

// 编辑文本块内容
export async function PATCH(request, { params }) {
  try {
    const { projectId, chunkId } = params;

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    if (!chunkId) {
      return NextResponse.json({ error: '文本块ID不能为空' }, { status: 400 });
    }

    // 解析请求体获取新内容
    const requestData = await request.json();
    const { content } = requestData;

    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    let res = await updateChunkById(chunkId, { content });
    return NextResponse.json(res);
  } catch (error) {
    console.error('编辑文本块失败:', error);
    return NextResponse.json({ error: error.message || '编辑文本块失败' }, { status: 500 });
  }
}
