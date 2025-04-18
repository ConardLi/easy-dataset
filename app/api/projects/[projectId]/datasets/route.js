import { NextResponse } from 'next/server';
import { getQuestionById, updateQuestion } from '@/lib/db/questions';
import { createDataset, deleteDataset, getDatasets, getDatasetsById, updateDataset } from '@/lib/db/datasets';
import { getProject } from '@/lib/db/projects';
import getAnswerPrompt from '@/lib/llm/prompts/answer';
import getAnswerEnPrompt from '@/lib/llm/prompts/answerEn';
import getOptimizeCotPrompt from '@/lib/llm/prompts/optimizeCot';
import getOptimizeCotEnPrompt from '@/lib/llm/prompts/optimizeCotEn';
import { v4 as uuidv4 } from 'uuid';
import { getChunkById } from '@/lib/db/chunks';

const LLMClient = require('@/lib/llm/core');

async function optimizeCot(originalQuestion, answer, originalCot, language, llmClient, id, projectId) {
  const prompt =
    language === 'en'
      ? getOptimizeCotEnPrompt(originalQuestion, answer, originalCot)
      : getOptimizeCotPrompt(originalQuestion, answer, originalCot);
  const { answer: optimizedAnswer } = await llmClient.getResponseWithCOT(prompt);
  await updateDataset({ id, cot: optimizedAnswer.replace('优化后的思维链', '') });
  console.log(originalQuestion, id, 'Successfully optimized thought process');
}

/**
 * 生成数据集（为单个问题生成答案）
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { questionId, model, language } = await request.json();
    // 验证参数
    if (!projectId || !questionId || !model) {
      return NextResponse.json(
        {
          error: '缺少必要参数'
        },
        { status: 400 }
      );
    }

    // 获取问题
    const question = await getQuestionById(questionId);
    if (!question) {
      return NextResponse.json(
        {
          error: 'Question not found'
        },
        { status: 404 }
      );
    }

    // 获取文本块内容
    const chunk = await getChunkById(question.chunkId);
    if (!chunk) {
      return NextResponse.json(
        {
          error: 'Text block does not exist'
        },
        { status: 404 }
      );
    }

    // 获取项目配置
    const project = await getProject(projectId);
    const { globalPrompt, answerPrompt } = project;

    // 创建LLM客户端
    const llmClient = new LLMClient(model);

    const promptFuc = language === 'en' ? getAnswerEnPrompt : getAnswerPrompt;

    // 生成答案的提示词
    const prompt = promptFuc({
      text: chunk.content,
      question: question.question,
      globalPrompt,
      answerPrompt
    });

    // 调用大模型生成答案
    const { answer, cot } = await llmClient.getResponseWithCOT(prompt);

    const datasetId = uuidv4();

    // 创建新的数据集项
    const datasets = {
      id: datasetId,
      projectId: projectId,
      question: question.question,
      answer: answer,
      chunkId: question.chunkId,
      model: model.modelName,
      cot: '',
      questionLabel: question.label || null
    };

    let dataset = await createDataset(datasets);
    if (cot) {
      // 为了性能考虑，这里异步优化
      optimizeCot(question.question, answer, cot, language, llmClient, datasetId, projectId);
    }
    if (dataset) {
      await updateQuestion({ id: questionId, answered: true });
    }
    console.log(datasets.length, 'Successfully generated dataset', question.question);

    return NextResponse.json({
      success: true,
      dataset
    });
  } catch (error) {
    console.error('Failed to generate dataset:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate dataset'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取项目的所有数据集
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json(
        {
          error: '项目ID不能为空'
        },
        { status: 400 }
      );
    }

    // 获取数据集
    const datasets = await getDatasets(projectId);

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('获取数据集失败:', error);
    return NextResponse.json(
      {
        error: error.message || '获取数据集失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 删除数据集
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');
    if (!datasetId) {
      return NextResponse.json(
        {
          error: 'Dataset ID cannot be empty'
        },
        { status: 400 }
      );
    }

    await deleteDataset(datasetId);

    return NextResponse.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete dataset:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete dataset'
      },
      { status: 500 }
    );
  }
}

/**
 * 编辑数据集
 */
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');
    const { answer, cot, confirmed } = await request.json();
    if (!datasetId) {
      return NextResponse.json(
        {
          error: 'Dataset ID cannot be empty'
        },
        { status: 400 }
      );
    }
    // 获取所有数据集
    let dataset = await getDatasetsById(datasetId, true);
    if (!dataset) {
      return NextResponse.json(
        {
          error: 'Dataset does not exist'
        },
        { status: 404 }
      );
    }
    let data = { id: datasetId };
    if (confirmed) data.confirmed = confirmed;
    if (answer) data.answer = answer;
    if (cot) data.cot = cot;

    // 保存更新后的数据集列表
    await updateDataset(data);

    return NextResponse.json({
      success: true,
      message: 'Dataset updated successfully',
      dataset: dataset
    });
  } catch (error) {
    console.error('Failed to update dataset:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update dataset'
      },
      { status: 500 }
    );
  }
}
