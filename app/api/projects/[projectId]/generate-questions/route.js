import { NextResponse } from 'next/server';
import { getProjectChunks } from '@/lib/text-splitter';
import { getTextChunk } from '@/lib/db/texts';
import LLMClient from '@/lib/llm/core/index';
import getQuestionPrompt from '@/lib/llm/prompts/question';
import getQuestionEnPrompt from '@/lib/llm/prompts/questionEn';
import { addQuestionsForChunk } from '@/lib/db/questions';
import { getTaskConfig } from '@/lib/db/projects';

const { extractJsonFromLLMOutput } = require('@/lib/llm/common/util');

// 批量生成问题
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    // 获取请求体
    const { model, chunkIds, language = '中文' } = await request.json();

    if (!model) {
      return NextResponse.json({ error: 'The model cannot be empty' }, { status: 400 });
    }

    // 如果没有指定文本块ID，则获取所有文本块
    let chunks = [];
    if (!chunkIds || chunkIds.length === 0) {
      const result = await getProjectChunks(projectId);
      chunks = result.chunks || [];
    } else {
      // 获取指定的文本块
      chunks = await Promise.all(
        chunkIds.map(async chunkId => {
          const chunk = await getTextChunk(projectId, chunkId);
          if (chunk) {
            return {
              id: chunk.id,
              content: chunk.content,
              length: chunk.content.length
            };
          }
          return null;
        })
      );
      chunks = chunks.filter(Boolean); // 过滤掉不存在的文本块
    }

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No valid text blocks found' }, { status: 404 });
    }

    const llmClient = new LLMClient({
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey,
      model: model.name,
      temperature: model.temperature,
      maxTokens: model.maxTokens
    });

    const results = [];
    const errors = [];

    // 获取项目 task-config 信息
    const taskConfig = await getTaskConfig(projectId);
    const { questionGenerationLength } = taskConfig;

    for (const chunk of chunks) {
      try {
        // 根据文本长度自动计算问题数量
        const questionNumber = Math.floor(chunk.length / questionGenerationLength);

        // 根据语言选择相应的提示词函数
        const promptFunc = language === 'en' ? getQuestionEnPrompt : getQuestionPrompt;
        // 生成问题
        const prompt = promptFunc(chunk.content, questionNumber, language);
        const response = await llmClient.getResponse(prompt);

        // 从LLM输出中提取JSON格式的问题列表
        const questions = extractJsonFromLLMOutput(response);

        if (questions && Array.isArray(questions)) {
          // 保存问题到数据库
          await addQuestionsForChunk(projectId, chunk.id, questions);

          results.push({
            chunkId: chunk.id,
            success: true,
            questions,
            total: questions.length
          });
        } else {
          errors.push({
            chunkId: chunk.id,
            error: 'Failed to parse questions'
          });
        }
      } catch (error) {
        console.error(`Failed to generate questions for text block ${chunk.id}:`, error);
        errors.push({
          chunkId: chunk.id,
          error: error.message || 'Failed to generate questions'
        });
      }
    }

    // 返回生成结果
    return NextResponse.json({
      results,
      errors,
      totalSuccess: results.length,
      totalErrors: errors.length,
      totalChunks: chunks.length
    });
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 });
  }
}
