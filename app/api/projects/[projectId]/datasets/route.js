import { NextResponse } from 'next/server';
import { getTextChunk } from '@/lib/db/texts';
import { getQuestionsForChunk } from '@/lib/db/questions';
import { getDatasets, saveDatasets, updateDataset } from '@/lib/db/datasets';
import { getProject } from '@/lib/db/projects';
import getAnswerPrompt from '@/lib/llm/prompts/answer';
import getAnswerEnPrompt from '@/lib/llm/prompts/answerEn';
import getOptimizeCotPrompt from '@/lib/llm/prompts/optimizeCot';
import getOptimizeCotEnPrompt from '@/lib/llm/prompts/optimizeCotEn';

const LLMClient = require('@/lib/llm/core');

async function optimizeCot(originalQuestion, answer, originalCot, language, llmClient, id, projectId) {
  const prompt =
    language === 'en'
      ? getOptimizeCotEnPrompt(originalQuestion, answer, originalCot)
      : getOptimizeCotPrompt(originalQuestion, answer, originalCot);
  const { answer: optimizedAnswer } = await llmClient.getResponseWithCOT(prompt);
  await updateDataset(projectId, id, { cot: optimizedAnswer.replace('优化后的思维链', '') });
  console.log(originalQuestion, id, 'Successfully optimized thought process');
}

/**
 * 生成数据集（为单个问题生成答案）
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { questionId, chunkId, model, language } = await request.json();

    // 验证参数
    if (!projectId || !questionId || !chunkId || !model) {
      return NextResponse.json(
        {
          error: '缺少必要参数'
        },
        { status: 400 }
      );
    }

    // 获取文本块内容
    const chunk = await getTextChunk(projectId, chunkId);
    if (!chunk) {
      return NextResponse.json(
        {
          error: 'Text block does not exist'
        },
        { status: 404 }
      );
    }

    // 获取问题
    const questions = await getQuestionsForChunk(projectId, chunkId);
    const question = questions.find(q => q.question === questionId);
    if (!question) {
      return NextResponse.json(
        {
          error: 'Question not found'
        },
        { status: 404 }
      );
    }

    // 获取项目配置
    const project = await getProject(projectId);
    const { globalPrompt, answerPrompt } = project;

    // 创建LLM客户端
    const llmClient = new LLMClient({
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
      temperature: model.temperature,
      maxTokens: model.maxTokens
    });

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

    // 获取现有数据集
    const datasets = await getDatasets(projectId);

    const datasetId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 创建新的数据集项
    const datasetItem = {
      id: datasetId,
      question: question.question,
      answer: answer,
      chunkId: chunkId,
      model: model.name,
      createdAt: new Date().toISOString(),
      questionLabel: question.label || null
    };

    if (cot) {
      // 为了性能考虑，这里异步优化
      optimizeCot(question.question, answer, cot, language, llmClient, datasetId, projectId);
    }

    // 添加到数据集
    datasets.push(datasetItem);
    await saveDatasets(projectId, datasets);
    console.log(datasets.length, 'Successfully generated dataset', question.question);

    return NextResponse.json({
      success: true,
      dataset: datasetItem
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
export async function DELETE(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');

    // 验证参数
    if (!projectId) {
      return NextResponse.json(
        {
          error: 'Project ID cannot be empty'
        },
        { status: 400 }
      );
    }

    if (!datasetId) {
      return NextResponse.json(
        {
          error: 'Dataset ID cannot be empty'
        },
        { status: 400 }
      );
    }

    // 获取所有数据集
    const datasets = await getDatasets(projectId);

    // 找到要删除的数据集索引
    const datasetIndex = datasets.findIndex(dataset => dataset.id === datasetId);

    if (datasetIndex === -1) {
      return NextResponse.json(
        {
          error: 'Dataset does not exist'
        },
        { status: 404 }
      );
    }

    // 删除数据集
    datasets.splice(datasetIndex, 1);

    // 保存更新后的数据集列表
    await saveDatasets(projectId, datasets);

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
export async function PATCH(request, { params }) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('id');
    const { answer, cot, confirmed } = await request.json();

    // 验证参数
    if (!projectId) {
      return NextResponse.json(
        {
          error: 'Project ID cannot be empty'
        },
        { status: 400 }
      );
    }

    if (!datasetId) {
      return NextResponse.json(
        {
          error: 'Dataset ID cannot be empty'
        },
        { status: 400 }
      );
    }

    // 获取所有数据集
    const datasets = await getDatasets(projectId);

    // 找到要编辑的数据集
    const datasetIndex = datasets.findIndex(dataset => dataset.id === datasetId);

    if (datasetIndex === -1) {
      return NextResponse.json(
        {
          error: 'Dataset does not exist'
        },
        { status: 404 }
      );
    }

    // 更新数据集
    const dataset = datasets[datasetIndex];
    if (answer !== undefined) dataset.answer = answer;
    if (cot !== undefined) dataset.cot = cot;
    if (confirmed !== undefined) dataset.confirmed = confirmed;

    // 保存更新后的数据集列表
    await saveDatasets(projectId, datasets);

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
