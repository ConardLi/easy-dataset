import { NextResponse } from 'next/server';
import { getQuestions, saveQuestions } from '@/lib/db/questions';
import { getDatasets } from '@/lib/db/datasets';

// 获取项目的所有问题
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
    }

    // 获取问题列表
    const nestedQuestions = await getQuestions(projectId);

    // 获取数据集
    const datasets = await getDatasets(projectId);

    // 将嵌套的问题数据结构拍平
    const flattenedQuestions = [];

    nestedQuestions.forEach(item => {
      const { chunkId, questions } = item;

      if (questions && Array.isArray(questions)) {
        questions.forEach(question => {
          const dataSites = datasets.filter(dataset => dataset.question === question.question);
          flattenedQuestions.push({
            ...question,
            chunkId,
            dataSites
          });
        });
      }
    });

    return NextResponse.json(flattenedQuestions);
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

    // 获取所有问题
    const questionsData = await getQuestions(projectId);

    // 找到或创建文本块
    let chunkIndex = questionsData.findIndex(item => item.chunkId === chunkId);
    if (chunkIndex === -1) {
      questionsData.push({
        chunkId: chunkId,
        questions: []
      });
      chunkIndex = questionsData.length - 1;
    }

    // 检查问题是否已存在
    const existingQuestion = questionsData[chunkIndex].questions.find(q => q.question === question);
    if (existingQuestion) {
      return NextResponse.json({ error: 'Question already exists' }, { status: 400 });
    }

    // 添加新问题
    questionsData[chunkIndex].questions.push({
      question: question,
      label: label || 'other'
    });

    // 保存更新后的数据
    await saveQuestions(projectId, questionsData);

    // 返回成功响应
    return NextResponse.json({
      question,
      chunkId,
      label,
      dataSites: [] // 新问题还没有数据集
    });
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 });
  }
}

// 更新问题
export async function PUT(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { question, oldQuestion, chunkId, label, oldChunkId } = body;

    // 验证必要参数
    if (!projectId || !question || !oldQuestion || !chunkId || !oldChunkId) {
      return NextResponse.json({ error: 'Missing necessary parameters' }, { status: 400 });
    }

    // 获取所有问题
    const questionsData = await getQuestions(projectId);

    // 找到原问题所在的文本块
    const oldChunkIndex = questionsData.findIndex(item => item.chunkId === oldChunkId);
    if (oldChunkIndex === -1) {
      return NextResponse.json({ error: 'Original chunk not found' }, { status: 404 });
    }

    // 找到原问题在文本块中的位置
    const oldQuestionIndex = questionsData[oldChunkIndex].questions.findIndex(q => q.question === oldQuestion);
    if (oldQuestionIndex === -1) {
      return NextResponse.json({ error: 'Original question not found' }, { status: 404 });
    }

    // 如果文本块发生变化
    if (chunkId !== oldChunkId) {
      // 从原文本块中删除问题
      questionsData[oldChunkIndex].questions.splice(oldQuestionIndex, 1);

      // 找到或创建新文本块
      let newChunkIndex = questionsData.findIndex(item => item.chunkId === chunkId);
      if (newChunkIndex === -1) {
        questionsData.push({
          chunkId: chunkId,
          questions: []
        });
        newChunkIndex = questionsData.length - 1;
      }

      // 添加到新文本块
      questionsData[newChunkIndex].questions.push({
        question: question,
        label: label || 'other'
      });
    } else {
      // 更新问题内容和标签
      questionsData[oldChunkIndex].questions[oldQuestionIndex] = {
        question: question,
        label: label || 'other'
      };
    }

    // 保存更新后的数据
    await saveQuestions(projectId, questionsData);

    const datasets = await getDatasets(projectId);
    const dataSites = datasets.filter(dataset => dataset.question === question);

    // 返回更新后的问题数据
    return NextResponse.json({
      question,
      chunkId,
      label,
      dataSites
    });
  } catch (error) {
    console.error('更新问题失败:', error);
    return NextResponse.json({ error: error.message || '更新问题失败' }, { status: 500 });
  }
}
