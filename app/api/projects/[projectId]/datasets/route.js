import { NextResponse } from 'next/server';
import { getQuestionById, updateQuestion } from '@/lib/db/questions';
import {
  createDataset,
  deleteDataset,
  getDatasetsById,
  getDatasetsByPagination,
  getDatasetsIds,
  updateDataset
} from '@/lib/db/datasets';
import { getProject } from '@/lib/db/projects';
import getAnswerPrompt from '@/lib/llm/prompts/answer';
import getAnswerEnPrompt from '@/lib/llm/prompts/answerEn';
import getOptimizeCotPrompt from '@/lib/llm/prompts/optimizeCot';
import getOptimizeCotEnPrompt from '@/lib/llm/prompts/optimizeCotEn';
import { getChunkById } from '@/lib/db/chunks';
import { nanoid } from 'nanoid';

const LLMClient = require('@/lib/llm/core');

async function optimizeCot(originalQuestion, answer, originalCot, language, llmClient, id, projectId) {
  const prompt =
    language === 'en'
      ? getOptimizeCotEnPrompt(originalQuestion, answer, originalCot)
      : getOptimizeCotPrompt(originalQuestion, answer, originalCot);
  const { answer: as, cot } = await llmClient.getResponseWithCOT(prompt);
  const optimizedAnswer = as || cot;
  const result = await updateDataset({ id, cot: optimizedAnswer.replace('优化后的思维链', '') });
  console.log(originalQuestion, id, 'Successfully optimized thought process', result);
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
    const idDistill = chunk.name === 'Distilled Content';

    // 获取项目配置
    const project = await getProject(projectId);
    const { globalPrompt, answerPrompt } = project;

    // 创建LLM客户端
    const llmClient = new LLMClient(model);

    const promptFuc = language === 'en' ? getAnswerEnPrompt : getAnswerPrompt;

    // 生成答案的提示词
    const prompt = idDistill
      ? question.question
      : promptFuc({
          text: chunk.content,
          question: question.question,
          globalPrompt,
          answerPrompt
        });

    // 调用大模型生成答案
    const { answer, cot } = await llmClient.getResponseWithCOT(prompt);

    const datasetId = nanoid(12);

    // 创建新的数据集项
    const datasets = {
      id: datasetId,
      projectId: projectId,
      question: question.question,
      answer: answer,
      model: model.modelName,
      cot: cot,
      questionLabel: question.label || null
    };

    let chunkData = await getChunkById(question.chunkId);
    datasets.chunkName = chunkData.name;
    datasets.chunkContent = ''; // 不再保存原始文本块内容
    datasets.questionId = question.id;

    let dataset = await createDataset(datasets);
    if (cot && !idDistill) {
      // 为了性能考虑，这里异步优化
      optimizeCot(question.question, answer, cot, language, llmClient, datasetId, projectId);
    }
    if (dataset) {
      await updateQuestion({ id: questionId, answered: true });
    }
    console.log('Successfully generated dataset', question.question);

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
    const { searchParams } = new URL(request.url);
    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }
    let status = searchParams.get('status');
    let confirmed = undefined;
    if (status === 'confirmed') confirmed = true;
    if (status === 'unconfirmed') confirmed = false;

    let selectedAll = searchParams.get('selectedAll');
    if (selectedAll) {
      let data = await getDatasetsIds(projectId, confirmed, searchParams.get('input'));
      return NextResponse.json(data);
    }

    // 获取数据集
    const datasets = await getDatasetsByPagination(
      projectId,
      parseInt(searchParams.get('page')),
      parseInt(searchParams.get('size')),
      confirmed,
      searchParams.get('input')
    );

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
    let dataset = await getDatasetsById(datasetId);
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
