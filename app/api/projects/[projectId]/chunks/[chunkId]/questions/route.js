import { NextResponse } from 'next/server';
import LLMClient from '@/lib/llm/core/index';
import getQuestionPrompt from '@/lib/llm/prompts/question';
import getQuestionEnPrompt from '@/lib/llm/prompts/questionEn';
import getAddLabelPrompt from '@/lib/llm/prompts/addLabel';
import getAddLabelEnPrompt from '@/lib/llm/prompts/addLabelEn';
import { getQuestionsForChunk, saveQuestions } from '@/lib/db/questions';
import { extractJsonFromLLMOutput } from '@/lib/llm/common/util';
import { getTaskConfig, getProject } from '@/lib/db/projects';
import { getTags } from '@/lib/db/tags';
import logger from '@/lib/util/logger';
import { getChunkById } from '@/lib/db/chunks';

// 为指定文本块生成问题
export async function POST(request, { params }) {
  try {
    const { projectId, chunkId } = params;

    // 验证项目ID和文本块ID
    if (!projectId || !chunkId) {
      return NextResponse.json({ error: 'Project ID or text block ID cannot be empty' }, { status: 400 });
    }

    // 获取请求体
    const { model, language = '中文', number } = await request.json();

    if (!model) {
      return NextResponse.json({ error: 'Model cannot be empty' }, { status: 400 });
    }

    // 并行获取文本块内容和项目配置
    const [chunk, taskConfig, project] = await Promise.all([
      getChunkById(chunkId),
      getTaskConfig(projectId),
      getProject(projectId)
    ]);

    if (!chunk) {
      return NextResponse.json({ error: 'Text block does not exist' }, { status: 404 });
    }

    // 获取项目 task-config 信息
    const config = await getProject(projectId);
    const { questionGenerationLength, questionMaskRemovingProbability = 60 } = taskConfig;
    const { globalPrompt, questionPrompt } = config;

    // 创建LLM客户端
    const llmClient = new LLMClient(model);
    // 生成问题的数量，如果未指定，则根据文本长度自动计算
    const questionNumber = number || Math.floor(chunk.content.length / questionGenerationLength);

    // 根据语言选择相应的提示词函数
    const promptFunc = language === 'en' ? getQuestionEnPrompt : getQuestionPrompt;
    const prompt = promptFunc({
      text: chunk.content,
      number: questionNumber,
      language,
      globalPrompt,
      questionPrompt
    });
    const response = await llmClient.getResponse(prompt);

    // 从LLM输出中提取JSON格式的问题列表
    const originalQuestions = extractJsonFromLLMOutput(response);
    const questions = randomRemoveQuestionMark(originalQuestions, questionMaskRemovingProbability);

    console.log(projectId, chunkId, 'Questions：', questions);
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
    }

    // 先获取标签，确保 tags 在后续逻辑中可用
    const tags = await getTags(projectId);
    // 根据语言选择标签提示词函数
    const labelPromptFunc = language === 'en' ? getAddLabelEnPrompt : getAddLabelPrompt;
    const labelPrompt = labelPromptFunc(JSON.stringify(tags), JSON.stringify(questions));

    const labelResponse = await llmClient.getResponse(labelPrompt);
    const labelQuestions = extractJsonFromLLMOutput(labelResponse);
    // 保存问题到数据库
    await saveQuestions(projectId, labelQuestions, chunkId);
    // 返回生成的问题
    return NextResponse.json({
      chunkId,
      labelQuestions,
      total: labelQuestions.length
    });
  } catch (error) {
    logger.error('Error generating questions:', error);
    return NextResponse.json({ error: error.message || 'Error generating questions' }, { status: 500 });
  }
}

// 获取指定文本块的问题
export async function GET(request, { params }) {
  try {
    const { projectId, chunkId } = params;

    // 验证项目ID和文本块ID
    if (!projectId || !chunkId) {
      return NextResponse.json({ error: 'The item ID or text block ID cannot be empty' }, { status: 400 });
    }

    // 获取文本块的问题
    const questions = await getQuestionsForChunk(projectId, chunkId);

    // 返回问题列表
    return NextResponse.json({
      chunkId,
      questions,
      total: questions.length
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return NextResponse.json({ error: error.message || 'Error getting questions' }, { status: 500 });
  }
}

// 按照配置文件中 questionMaskRemovingProbability 随机去除问题结尾问号
function randomRemoveQuestionMark(questions, questionMaskRemovingProbability) {
  for (let i = 0; i < questions.length; i++) {
    // 去除问题结尾的空格
    let question = questions[i].trimEnd();

    if (Math.random() * 100 < questionMaskRemovingProbability && (question.endsWith('?') || question.endsWith('？'))) {
      question = question.slice(0, -1);
    }
    questions[i] = question;
  }
  return questions;
}
