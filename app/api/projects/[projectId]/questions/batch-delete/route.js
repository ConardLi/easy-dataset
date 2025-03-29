import { NextResponse } from 'next/server';
import { batchDeleteQuestions } from '@/lib/db/questions';

// 批量删除问题
export async function DELETE(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 从请求体中获取要删除的问题列表
    const { questions } = await request.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions list is required' }, { status: 400 });
    }

    // 验证每个问题都有必要的字段
    for (const question of questions) {
      if (!question.questionId || !question.chunkId) {
        return NextResponse.json(
          { error: 'Question information is incomplete, must include questionId and chunkId' },
          { status: 400 }
        );
      }
    }

    // 批量删除问题
    await batchDeleteQuestions(projectId, questions);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${questions.length} questions`
    });
  } catch (error) {
    console.error('Failed to batch delete questions:', error);
    return NextResponse.json({ error: error.message || 'Failed to batch delete questions' }, { status: 500 });
  }
}
