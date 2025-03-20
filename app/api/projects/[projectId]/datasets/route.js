import { NextResponse } from 'next/server';
import { getTextChunk } from '@/lib/db/texts';
import { getQuestionsForChunk } from '@/lib/db/questions';
import { getDatasets, saveDatasets } from '@/lib/db/datasets';
import getAnswerPrompt from '@/lib/llm/prompts/answer';
import getAnswerEnPrompt from '@/lib/llm/prompts/answerEn';
import { extractThinkChain, extractAnswer } from '@/lib/llm/common/util';


const LLMClient = require('@/lib/llm/core');

/**
 * 生成数据集（为单个问题生成答案）
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { questionId, chunkId, model, language } = await request.json();

    // 验证参数
    if (!projectId || !questionId || !chunkId || !model) {
      return NextResponse.json({
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 获取文本块内容
    const chunk = await getTextChunk(projectId, chunkId);
    if (!chunk) {
      return NextResponse.json({
        error: '文本块不存在'
      }, { status: 404 });
    }

    // 获取问题
    const questions = await getQuestionsForChunk(projectId, chunkId);
    const question = questions.find(q => q.question === questionId);
    if (!question) {
      return NextResponse.json({
        error: '问题不存在'
      }, { status: 404 });
    }

    // 创建LLM客户端
    const llmClient = new LLMClient({
      providerId: model.providerId,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
    });

    // 生成答案的提示词
    const prompt = language === 'en' ? getAnswerEnPrompt(chunk.content, question.question) : getAnswerPrompt(chunk.content, question.question);

    // console.log(prompt);
    // 调用大模型生成答案
    const llmRes = await llmClient.chat(prompt);
    let answer = llmRes

    let cot = '';
    if (answer.startsWith('<think>') || answer.startsWith('<thinking>')) {
      cot = extractThinkChain(answer);
      answer = extractAnswer(answer);
    } else {
      cot = llmRes.choices?.[0]?.message?.reasoning_content || llmRes.choices?.[0]?.message?.reasoning || '';
    }


    console.log(questionId, 'answer:', answer, cot);
    // 获取现有数据集
    const datasets = await getDatasets(projectId);

    // 创建新的数据集项
    const datasetItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      question: question.question,
      answer: answer,
      cot,
      chunkId: chunkId,
      model: model.name,
      createdAt: new Date().toISOString(),
      questionLabel: question.label || null
    };

    // 添加到数据集
    datasets.push(datasetItem);
    await saveDatasets(projectId, datasets);

    return NextResponse.json({
      success: true,
      dataset: datasetItem
    });
  } catch (error) {
    console.error('生成数据集失败:', error);
    return NextResponse.json({
      error: error.message || '生成数据集失败'
    }, { status: 500 });
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
      return NextResponse.json({
        error: '项目ID不能为空'
      }, { status: 400 });
    }

    // 获取数据集
    const datasets = await getDatasets(projectId);

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('获取数据集失败:', error);
    return NextResponse.json({
      error: error.message || '获取数据集失败'
    }, { status: 500 });
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
      return NextResponse.json({
        error: '项目ID不能为空'
      }, { status: 400 });
    }

    if (!datasetId) {
      return NextResponse.json({
        error: '数据集ID不能为空'
      }, { status: 400 });
    }

    // 获取所有数据集
    const datasets = await getDatasets(projectId);

    // 找到要删除的数据集索引
    const datasetIndex = datasets.findIndex(dataset => dataset.id === datasetId);

    if (datasetIndex === -1) {
      return NextResponse.json({
        error: '数据集不存在'
      }, { status: 404 });
    }

    // 删除数据集
    datasets.splice(datasetIndex, 1);

    // 保存更新后的数据集列表
    await saveDatasets(projectId, datasets);

    return NextResponse.json({
      success: true,
      message: '数据集删除成功'
    });
  } catch (error) {
    console.error('删除数据集失败:', error);
    return NextResponse.json({
      error: error.message || '删除数据集失败'
    }, { status: 500 });
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
      return NextResponse.json({
        error: '项目ID不能为空'
      }, { status: 400 });
    }

    if (!datasetId) {
      return NextResponse.json({
        error: '数据集ID不能为空'
      }, { status: 400 });
    }

    // 获取所有数据集
    const datasets = await getDatasets(projectId);

    // 找到要编辑的数据集
    const datasetIndex = datasets.findIndex(dataset => dataset.id === datasetId);

    if (datasetIndex === -1) {
      return NextResponse.json({
        error: '数据集不存在'
      }, { status: 404 });
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
      message: '数据集更新成功',
      dataset: dataset
    });
  } catch (error) {
    console.error('编辑数据集失败:', error);
    return NextResponse.json({
      error: error.message || '编辑数据集失败'
    }, { status: 500 });
  }
}
