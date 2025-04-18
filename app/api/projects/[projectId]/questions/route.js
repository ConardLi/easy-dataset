import { NextResponse } from 'next/server';
import { getQuestions, isExistByQuestion, saveQuestions, updateQuestion } from '@/lib/db/questions';

// 获取项目的所有问题
export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    let status = searchParams.get('status');
    let answered = undefined;
    if (status === 'answered') answered = true;
    if (status === 'unanswered') answered = false;
    // 获取问题列表
    const questions = await getQuestions(
      projectId,
      parseInt(searchParams.get('page')),
      parseInt(searchParams.get('size')),
      answered,
      searchParams.get('input')
    );
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Failed to get questions:', error);
    return NextResponse.json({ error: error.message || 'Failed to get questions' }, { status: 500 });
  }
}

// 新增问题
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { question, chunkId, label } = body;

    // 验证必要参数
    if (!projectId || !question || !chunkId) {
      return NextResponse.json({ error: 'Missing necessary parameters' }, { status: 400 });
    }

    // 检查问题是否已存在
    const existingQuestion = await isExistByQuestion(question);
    if (existingQuestion) {
      return NextResponse.json({ error: 'Question already exists' }, { status: 400 });
    }

    // 添加新问题
    let questions = [
      {
        chunkId: chunkId,
        question: question,
        label: label || 'other'
      }
    ];
    // 保存更新后的数据
    let data = await saveQuestions(projectId, questions);

    // 返回成功响应
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 });
  }
}

// 更新问题
export async function PUT(request) {
  try {
    const body = await request.json();
    // 保存更新后的数据
    let data = await updateQuestion(body);
    // 返回更新后的问题数据
    return NextResponse.json(data);
  } catch (error) {
    console.error('更新问题失败:', error);
    return NextResponse.json({ error: error.message || '更新问题失败' }, { status: 500 });
  }
}
