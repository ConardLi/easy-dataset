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
import getEnhancedAnswerPrompt from '@/lib/llm/prompts/enhancedAnswer';
import getEnhancedAnswerEnPrompt from '@/lib/llm/prompts/enhancedAnswerEn';
import getContextualAnswerPrompt from '@/lib/llm/prompts/contextualAnswer';
import getGlobalAnswerPrompt from '@/lib/llm/prompts/globalAnswer';
import getOptimizeCotPrompt from '@/lib/llm/prompts/optimizeCot';
import getOptimizeCotEnPrompt from '@/lib/llm/prompts/optimizeCotEn';
import { getChunkById, getChunksByFileId } from '@/lib/db/chunks';
import { getProjectTocByName } from '@/lib/file/text-splitter';
import { getActiveGaPairsByFileId } from '@/lib/db/ga-pairs';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db/index';
import { processTask } from '@/lib/services/tasks';
import LLMClient from '@/lib/llm/core/index';
import logger from '@/lib/util/logger';

/**
 * 优化思维链
 * @param {string} originalQuestion - 原始问题
 * @param {string} answer - 答案
 * @param {string} originalCot - 原始思维链
 * @param {string} language - 语言
 * @param {object} llmClient - LLM客户端
 * @param {string} id - 数据集ID
 * @param {string} projectId - 项目ID
 */
async function optimizeCot(originalQuestion, answer, originalCot, language, llmClient, id, projectId) {
  try {
    const prompt =
      language === 'en'
        ? getOptimizeCotEnPrompt(originalQuestion, answer, originalCot)
        : getOptimizeCotPrompt(originalQuestion, answer, originalCot);
    const { answer: as, cot } = await llmClient.getResponseWithCOT(prompt);
    const optimizedAnswer = as || cot;
    const result = await updateDataset({ id, cot: optimizedAnswer.replace('优化后的思维链', '') });
    logger.info(`成功优化思维链: ${originalQuestion}, ID: ${id}`);
    return result;
  } catch (error) {
    logger.error(`优化思维链失败: ${error.message}`);
    throw error;
  }
}

/**
 * 为单个问题生成答案并创建数据集
 * @param {string} projectId - 项目ID
 * @param {string} questionId - 问题ID
 * @param {object} options - 选项
 * @param {string} options.model - 模型名称
 * @param {string} options.language - 语言(中文/en)
 * @returns {Promise<Object>} 生成的数据集
 */
export async function generateDatasetForQuestion(projectId, questionId, options) {
  try {
    const { model, language = '中文' } = options;

    if (!projectId || !questionId || !model) throw new Error('Missing required parameters');

    const question = await getQuestionById(questionId);
    if (!question) throw new Error('Question not found');

    const llmClient = new LLMClient(model);
    let prompt;
    let answer, cot;
    let useEnhancedPrompt = false;

    let metadata = null;
    try {
      if (question.metadata) {
        metadata = JSON.parse(question.metadata);
      }
    } catch (e) {
      logger.warn(`Failed to parse metadata for question ${questionId}`);
    }

    if (metadata?.type === 'contextual') {
      logger.info(`Generating contextual answer for question ${questionId}`);
      const currentChunk = await getChunkById(question.chunkId);
      const prevChunk = metadata.previousChunkId ? await getChunkById(metadata.previousChunkId) : null;
      const nextChunk = metadata.nextChunkId ? await getChunkById(metadata.nextChunkId) : null;

      prompt = getContextualAnswerPrompt({
        question: question.question,
        previousText: prevChunk?.content,
        currentText: currentChunk.content,
        nextText: nextChunk?.content,
        language,
      });
      ({ answer, cot } = await llmClient.getResponseWithCOT(prompt));

    } else if (metadata?.type === 'global') {
      logger.info(`Generating global answer for question ${questionId}`);
      const fileChunks = await getChunksByFileId(metadata.fileId);
      const fullContext = fileChunks.map(c => c.content).join('\n\n---\n\n');
      const toc = await getProjectTocByName(projectId, fileChunks[0]?.fileName);

      prompt = getGlobalAnswerPrompt({
        question: question.question,
        fullContext,
        toc,
        language,
      });
      ({ answer, cot } = await llmClient.getResponseWithCOT(prompt));

    } else {
      // Default: Local or GA-enhanced answer generation
      const chunk = await getChunkById(question.chunkId);
      if (!chunk) throw new Error('Chunk not found');
      const idDistill = chunk.name === 'Distilled Content';
      const project = await getProject(projectId);
      const { globalPrompt, answerPrompt } = project;

      if (idDistill) {
        prompt = question.question;
      } else {
        const activeGaPairs = chunk.fileId ? await getActiveGaPairsByFileId(chunk.fileId) : [];
        const questionLinkedGaPair = question.gaPairId ? activeGaPairs.find(ga => ga.id === question.gaPairId) : null;

        if (questionLinkedGaPair) {
          useEnhancedPrompt = true;
          const enhancedPromptFunc = language === 'en' ? getEnhancedAnswerEnPrompt : getEnhancedAnswerPrompt;
          prompt = enhancedPromptFunc({
            text: chunk.content,
            question: question.question,
            globalPrompt,
            answerPrompt,
            activeGaPair: {
              genre: `${questionLinkedGaPair.genreTitle}: ${questionLinkedGaPair.genreDesc}`,
              audience: `${questionLinkedGaPair.audienceTitle}: ${questionLinkedGaPair.audienceDesc}`,
              active: questionLinkedGaPair.isActive,
            },
          });
          logger.info(`Using MGA enhanced prompt to generate answer for question ${questionId}`);
        } else {
          const promptFunc = language === 'en' ? getAnswerEnPrompt : getAnswerPrompt;
          prompt = promptFunc({
            text: chunk.content,
            question: question.question,
            globalPrompt,
            answerPrompt,
          });
          logger.info(`Using standard prompt to generate answer for question ${questionId}`);
        }
      }
      ({ answer, cot } = await llmClient.getResponseWithCOT(prompt));
    }

    const datasetId = nanoid(12);

    const chunkData = await getChunkById(question.chunkId);
    const datasets = {
      id: datasetId,
      projectId: projectId,
      question: question.question,
      answer: answer,
      model: model.modelName,
      cot: cot,
      questionLabel: question.label || null,
      chunkName: chunkData.name,
      chunkContent: '',
      questionId: question.id,
    };

    let dataset = await createDataset(datasets);

    // Asynchronously optimize CoT for non-distilled content
    if (cot && chunkData.name !== 'Distilled Content') {
      optimizeCot(question.question, answer, cot, language, llmClient, datasetId, projectId).catch(e => logger.error(`CoT optimization failed: ${e.message}`));
    }

    await updateQuestion({ id: questionId, answered: true });

    // Asynchronously trigger a validation task
    db.task.create({
      data: {
        projectId,
        taskType: 'answer-validation',
        status: 0, // Processing
        note: JSON.stringify({ datasetId: dataset.id }),
        modelInfo: JSON.stringify(model),
      }
    }).then(task => {
      processTask(task.id);
      logger.info(`Created and triggered answer validation task ${task.id} for dataset ${dataset.id}`);
    }).catch(e => {
      logger.error(`Failed to create answer validation task for dataset ${dataset.id}:`, e);
    });

    const logMessage = useEnhancedPrompt
      ? `成功生成MGA增强数据集: ${question.question}`
      : `成功生成标准数据集: ${question.question}`;
    logger.info(logMessage);

    return {
      success: true,
      dataset,
      mgaEnhanced: useEnhancedPrompt,
    };
  } catch (error) {
    logger.error(`生成数据集失败: ${error.message}`);
    throw error;
  }
}

export default {
  generateDatasetForQuestion,
  optimizeCot
};
