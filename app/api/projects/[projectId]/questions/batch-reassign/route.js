import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { questionIds, targetChunkId } = await request.json();

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Missing or empty questionIds' }, { status: 400 });
    }

    if (!targetChunkId) {
      return NextResponse.json({ error: 'Missing targetChunkId' }, { status: 400 });
    }

    const targetChunk = await db.chunks.findFirst({
      where: { id: targetChunkId, projectId }
    });

    if (!targetChunk) {
      return NextResponse.json({ error: 'Target chunk not found in this project' }, { status: 404 });
    }

    const result = await db.questions.updateMany({
      where: {
        id: { in: questionIds },
        projectId
      },
      data: {
        chunkId: targetChunkId
      }
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      targetChunkName: targetChunk.name
    });
  } catch (error) {
    console.error('Batch reassign questions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
