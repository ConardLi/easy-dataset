import LLMClient from '@/lib/llm/core/index';
import getQuestionPrompt from '@/lib/llm/prompts/question';
import getQuestionEnPrompt from '@/lib/llm/prompts/questionEn';
import getAddLabelPrompt from '@/lib/llm/prompts/addLabel';
import getAddLabelEnPrompt from '@/lib/llm/prompts/addLabelEn';
import { extractJsonFromLLMOutput } from '@/lib/llm/common/util';
import { getTaskConfig, getProject } from '@/lib/db/projects';
import { getTags } from '@/lib/db/tags';
import { getChunkById } from '@/lib/db/chunks';
import { saveQuestions, saveQuestionsWithGaPair } from '@/lib/db/questions';
import { getActiveGaPairsByFileId } from '@/lib/db/ga-pairs';
import logger from '@/lib/util/logger';

/**
 * 随机移除问题中的问号
 */
function randomRemoveQuestionMark(questions, probability) {
  return questions.map(q => {
    let question = q.trimEnd();
    if (Math.random() * 100 < probability && (question.endsWith('?') || question.endsWith('？'))) {
      return question.slice(0, -1);
    }
    return question;
  });
}

/**
 * 内部核心函数：为给定的prompt生成、标注并保存问题
 * @private
 */
async function _generateAndSaveQuestions(llmClient, projectId, chunkId, prompt, questionMaskRemovingProbability, gaPairId = null) {
  const response = await llmClient.getResponse(prompt);
  const originalQuestions = extractJsonFromLLMOutput(response);

  if (!originalQuestions || !Array.isArray(originalQuestions) || originalQuestions.length === 0) {
    logger.warn(`LLM did not return valid questions for chunk ${chunkId}.`);
    return [];
  }

  const questions = randomRemoveQuestionMark(originalQuestions, questionMaskRemovingProbability);

  // 为问题添加标签
  const tags = await getTags(projectId); // TODO: 优化，避免重复获取
  const labelPromptFunc = prompt.includes('language: "en"') ? getAddLabelEnPrompt : getAddLabelPrompt;
  const labelPrompt = labelPromptFunc(JSON.stringify(tags), JSON.stringify(questions));
  const labelResponse = await llmClient.getResponse(labelPrompt);
  const labeledQuestions = extractJsonFromLLMOutput(labelResponse);

  if (!labeledQuestions || !Array.isArray(labeledQuestions)) {
    logger.warn(`Failed to label questions for chunk ${chunkId}.`);
    // 即使标注失败，也保存原始问题
    await (gaPairId
      ? saveQuestionsWithGaPair(projectId, questions.map(q => ({ question: q })), chunkId, gaPairId)
      : saveQuestions(projectId, questions.map(q => ({ question: q })), chunkId));
    return questions;
  }

  // 保存带标签的问题
  await (gaPairId
    ? saveQuestionsWithGaPair(projectId, labeledQuestions, chunkId, gaPairId)
    : saveQuestions(projectId, labeledQuestions, chunkId));

  return labeledQuestions;
}

/**
 * 为指定文本块生成问题（支持GA增强）
 * @param {String} projectId 项目ID
 * @param {String} chunkId 文本块ID
 * @param {Object} options 选项
 * @returns {Promise<Object>} 生成结果
 */
export async function generateQuestionsForChunkWithGA(projectId, chunkId, options) {
  try {
    const { model, language = '中文', number } = options;

    if (!model) {
      throw new Error('模型名称不能为空');
    }

    const [chunk, taskConfig, project] = await Promise.all([
      getChunkById(chunkId),
      getTaskConfig(projectId),
      getProject(projectId)
    ]);

    if (!chunk) {
      throw new Error('文本块不存在');
    }

    const { questionGenerationLength, questionMaskRemovingProbability = 60 } = taskConfig;
    const { globalPrompt, questionPrompt } = project;

    let activeGaPairs = [];
    if (chunk.fileId) {
      try {
        activeGaPairs = await getActiveGaPairsByFileId(chunk.fileId);
      } catch (error) {
        logger.warn(`获取GA pairs失败: ${error.message}`);
      }
    }

    const useGaExpansion = activeGaPairs.length > 0;
    const llmClient = new LLMClient(model);
    const baseQuestionNumber = number || Math.floor(chunk.content.length / questionGenerationLength);
    let allGeneratedQuestions = [];

    if (useGaExpansion) {
      logger.info(`GA模式: ${activeGaPairs.length} pairs, base questions: ${baseQuestionNumber}`);
      for (const gaPair of activeGaPairs) {
        const activeGaPair = {
          genre: `${gaPair.genreTitle}: ${gaPair.genreDesc}`,
          audience: `${gaPair.audienceTitle}: ${gaPair.audienceDesc}`,
          active: gaPair.isActive
        };
        const promptFunc = language === 'en' ? getQuestionEnPrompt : getQuestionPrompt;
        const prompt = promptFunc({ text: chunk.content, number: baseQuestionNumber, language, globalPrompt, questionPrompt, activeGaPair });

        const questions = await _generateAndSaveQuestions(llmClient, projectId, chunkId, prompt, questionMaskRemovingProbability, gaPair.id);
        allGeneratedQuestions.push(...questions.map(q => ({...q, gaPairId: gaPair.id})));
      }
    } else {
      logger.info(`标准模式: ${baseQuestionNumber} questions`);
      const promptFunc = language === 'en' ? getQuestionEnPrompt : getQuestionPrompt;
      const prompt = promptFunc({ text: chunk.content, number: baseQuestionNumber, language, globalPrompt, questionPrompt });

      const questions = await _generateAndSaveQuestions(llmClient, projectId, chunkId, prompt, questionMaskRemovingProbability, null);
      allGeneratedQuestions = questions;
    }

    return {
      chunkId,
      questions: allGeneratedQuestions,
      total: allGeneratedQuestions.length,
      gaExpansionUsed: useGaExpansion,
    };
  } catch (error) {
    logger.error(`GA增强问题生成时出错 for chunk ${chunkId}:`, error);
    throw error;
  }
}

/**
 * 为指定文本块生成问题 (旧版，保留API兼容性)
 */
export async function generateQuestionsForChunk(projectId, chunkId, options) {
    return generateQuestionsForChunkWithGA(projectId, chunkId, {...options, enableGaExpansion: false });
}


export default {
  generateQuestionsForChunk,
  generateQuestionsForChunkWithGA
};
