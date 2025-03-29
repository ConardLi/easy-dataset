import { NextResponse } from 'next/server';
import { getChunkContent } from '@/lib/text-splitter';
import fs from 'fs/promises';
import path from 'path';
import { getProjectRoot } from '@/lib/db/base';

// 获取文本块内容
export async function GET(request, { params }) {
  try {
    const { projectId, chunkId: c } = params;

    const chunkId = decodeURIComponent(c);

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    if (!chunkId) {
      return NextResponse.json({ error: 'Text block ID cannot be empty' }, { status: 400 });
    }

    // 获取文本块内容
    const chunk = await getChunkContent(projectId, chunkId);

    return NextResponse.json(chunk);
  } catch (error) {
    console.error('Failed to get text block content:', error);
    return NextResponse.json({ error: error.message || 'Failed to get text block content' }, { status: 500 });
  }
}

// 删除文本块
export async function DELETE(request, { params }) {
  try {
    const { projectId, chunkId: c } = params;

    const chunkId = decodeURIComponent(c);

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    if (!chunkId) {
      return NextResponse.json({ error: 'Text block ID cannot be empty' }, { status: 400 });
    }

    // 获取文本块路径
    const projectRoot = await getProjectRoot();
    const chunkPath = path.join(projectRoot, projectId, 'chunks', `${chunkId}.txt`);

    // 检查文件是否存在
    try {
      await fs.access(chunkPath);
    } catch (error) {
      return NextResponse.json({ error: 'Text block does not exist' }, { status: 404 });
    }

    // 删除文件
    await fs.unlink(chunkPath);

    return NextResponse.json({ message: 'Text block deleted successfully' });
  } catch (error) {
    console.error('Failed to delete text block:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete text block' }, { status: 500 });
  }
}
