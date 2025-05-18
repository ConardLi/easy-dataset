import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * 根据标签ID获取问题列表
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    console.log('[distill/questions/by-tag] 请求参数:', { projectId, tagId });

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    if (!tagId) {
      return NextResponse.json({ error: '标签ID不能为空' }, { status: 400 });
    }

    // 获取标签信息
    const tag = await db.tags.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    console.log('[distill/questions/by-tag] 标签信息:', tag);

    // 获取或创建蒸馏文本块
    let distillChunk = await db.chunks.findFirst({
      where: {
        projectId,
        name: 'Distilled Content'
      }
    });

    if (!distillChunk) {
      // 创建一个特殊的蒸馏文本块
      distillChunk = await db.chunks.create({
        data: {
          name: 'Distilled Content',
          projectId,
          fileId: 'distilled',
          fileName: 'distilled.md',
          content:
            'This text block is used to store questions generated through data distillation and is not related to actual literature.',
          summary: 'Questions generated through data distillation',
          size: 0
        }
      });
    }
    const questions = await db.questions.findMany({
      where: {
        projectId,
        label: tag.label,
        chunkId: distillChunk.id
      }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('[distill/questions/by-tag] 获取问题失败:', error);
    return NextResponse.json({ error: error.message || '获取问题失败' }, { status: 500 });
  }
}
