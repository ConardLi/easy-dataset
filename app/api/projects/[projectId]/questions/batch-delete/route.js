import { NextResponse } from 'next/server';
import { batchDeleteQuestions } from '@/lib/db/questions';

// 批量删除问题
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { questionIds } = body;

    // 验证参数
    if (questionIds.length === 0) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // 删除问题
    await batchDeleteQuestions(questionIds);

    return NextResponse.json({ success: true, message: 'Delete successful' });
  } catch (error) {
    console.error('Delete failed:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
