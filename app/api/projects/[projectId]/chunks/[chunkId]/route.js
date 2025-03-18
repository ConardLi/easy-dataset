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
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    if (!chunkId) {
      return NextResponse.json({ error: '文本块ID不能为空' }, { status: 400 });
    }

    // 获取文本块内容
    const chunk = await getChunkContent(projectId, chunkId);

    return NextResponse.json(chunk);
  } catch (error) {
    console.error('获取文本块内容出错:', error);
    return NextResponse.json({ error: error.message || '获取文本块内容失败' }, { status: 500 });
  }
}

// 删除文本块
export async function DELETE(request, { params }) {
  try {
    const { projectId, chunkId: c } = params;

    const chunkId = decodeURIComponent(c);

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    if (!chunkId) {
      return NextResponse.json({ error: '文本块ID不能为空' }, { status: 400 });
    }

    // 获取文本块路径
    const projectRoot = await getProjectRoot();
    const chunkPath = path.join(projectRoot, projectId, 'chunks', `${chunkId}.txt`);

    // 检查文件是否存在
    try {
      await fs.access(chunkPath);
    } catch (error) {
      return NextResponse.json({ error: '文本块不存在' }, { status: 404 });
    }

    // 删除文件
    await fs.unlink(chunkPath);

    return NextResponse.json({ message: '文本块已删除' });
  } catch (error) {
    console.error('删除文本块出错:', error);
    return NextResponse.json({ error: error.message || '删除文本块失败' }, { status: 500 });
  }
}
