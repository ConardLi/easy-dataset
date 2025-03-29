import { NextResponse } from 'next/server';
import { getDataset, updateDataset } from '@/lib/db/datasets';
import LLMClient from '@/lib/llm/core/index';
import getNewAnswerPrompt from '@/lib/llm/prompts/newAnswer';
import getNewAnswerEnPrompt from '@/lib/llm/prompts/newAnswerEn';

import { extractJsonFromLLMOutput } from '@/lib/llm/common/util';

// 优化数据集答案
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    // 获取请求体
    const { datasetId, model, advice, language } = await request.json();

    if (!datasetId) {
      return NextResponse.json({ error: 'Dataset ID cannot be empty' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Model cannot be empty' }, { status: 400 });
    }

    if (!advice) {
      return NextResponse.json({ error: 'Please provide optimization suggestions' }, { status: 400 });
    }

    // 获取数据集内容
    const dataset = await getDataset(projectId, datasetId);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset does not exist' }, { status: 404 });
    }

    // 创建LLM客户端
    const llmClient = new LLMClient({
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
      temperature: model.temperature,
      maxTokens: model.maxTokens
    });

    // 生成优化后的答案和思维链
    const prompt =
      language === 'en'
        ? getNewAnswerEnPrompt(dataset.question, dataset.answer || '', dataset.cot || '', advice)
        : getNewAnswerPrompt(dataset.question, dataset.answer || '', dataset.cot || '', advice);

    const response = await llmClient.getResponse(prompt);

    // 从LLM输出中提取JSON格式的优化结果
    const optimizedResult = extractJsonFromLLMOutput(response);

    if (!optimizedResult || !optimizedResult.answer) {
      return NextResponse.json({ error: 'Failed to optimize answer, please try again' }, { status: 500 });
    }

    // 更新数据集
    const updatedDataset = {
      ...dataset,
      answer: optimizedResult.answer,
      cot: optimizedResult.cot || dataset.cot
    };

    await updateDataset(projectId, datasetId, updatedDataset);

    // 返回优化后的数据集
    return NextResponse.json({
      success: true,
      dataset: updatedDataset
    });
  } catch (error) {
    console.error('Failed to optimize answer:', error);
    return NextResponse.json({ error: error.message || 'Failed to optimize answer' }, { status: 500 });
  }
}
