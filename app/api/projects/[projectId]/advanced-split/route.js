import { NextResponse } from 'next/server';
import { saveChunks, deleteChunksByFileId } from '@/lib/db/chunks';
import path from 'path';

/**
 * 高级 Markdown 分块保存 API
 * 接收预览阶段生成的分块数据，写入数据库
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { fileId, fileName, chunks } = await request.json();

    if (!projectId || !fileId || !fileName || !chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectId, fileId, fileName, chunks' },
        { status: 400 }
      );
    }

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Chunks array is empty' }, { status: 400 });
    }

    // 先删除该文件已有的文本块
    await deleteChunksByFileId(projectId, fileId);

    // 将预览数据转为 DB 格式
    const dbChunks = chunks.map((chunk, index) => {
      const baseName = path.basename(fileName, path.extname(fileName));
      return {
        projectId,
        name: `${baseName}-part-${index + 1}`,
        fileId,
        fileName,
        content: chunk.content,
        summary: chunk.summary || `${fileName} Part ${index + 1}`,
        size: chunk.content.length,
        headingPath: chunk.headingPath && chunk.headingPath.length > 0
          ? JSON.stringify(chunk.headingPath)
          : ''
      };
    });

    // 保存到数据库
    await saveChunks(dbChunks);

    return NextResponse.json({
      success: true,
      message: 'Advanced chunks saved successfully',
      totalChunks: dbChunks.length
    });
  } catch (error) {
    console.error('Advanced split save error:', String(error));
    return NextResponse.json(
      { error: error.message || 'Failed to save advanced split chunks' },
      { status: 500 }
    );
  }
}
