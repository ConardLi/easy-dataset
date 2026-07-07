import { NextResponse } from 'next/server';
import { getChunksByFileId } from '@/lib/db/chunks';

/**
 * 获取指定文件已保存的高级分块数据
 * 用于对话框重新打开时恢复上次保存的结果
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!projectId || !fileId) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectId, fileId' },
        { status: 400 }
      );
    }

    const chunks = await getChunksByFileId(fileId);

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ success: true, chunks: [] });
    }

    // 转为前端需要的格式
    const formattedChunks = chunks.map(chunk => {
      let headingPath = [];
      try {
        headingPath = chunk.headingPath ? JSON.parse(chunk.headingPath) : [];
      } catch (e) {
        headingPath = [];
      }
      return {
        id: chunk.id,
        content: chunk.content,
        summary: chunk.summary || '',
        size: chunk.size || chunk.content.length,
        qualityScore: null, // 已保存的分块不重新评分
        headings: headingPath,  // 用完整路径支持大纲树跳转
        headingPath
      };
    });

    return NextResponse.json({
      success: true,
      chunks: formattedChunks,
      savedAt: chunks[0]?.updateAt || chunks[0]?.createAt || null
    });
  } catch (error) {
    console.error('Failed to get advanced split chunks:', String(error));
    return NextResponse.json(
      { error: error.message || 'Failed to get advanced split chunks' },
      { status: 500 }
    );
  }
}
