import { PrismaClient } from '@prisma/client';
import questionService from '@/lib/services/questions';
import LLMClient from '@/lib/llm/core/index';
import getContextualQuestionPrompt from '@/lib/llm/prompts/contextualQuestion';
import getGlobalQuestionPrompt from '@/lib/llm/prompts/globalQuestion';
import { getProjectTocByName } from '@/lib/file/text-splitter';
import { extractJsonFromLLMOutput } from '@/lib/llm/common/util';
import { saveQuestions } from '@/lib/db/questions';
import logger from '@/lib/util/logger';
import { processInParallel } from '@/lib/util/async';
import { getTaskConfig } from '@/lib/db/projects';

const prisma = new PrismaClient();

async function executeGenerationInParallel(items, processFunction, projectId) {
    const taskConfig = await getTaskConfig(projectId);
    const concurrencyLimit = taskConfig?.concurrencyLimit || 2;
    const results = await processInParallel(items, processFunction, concurrencyLimit);
    return results.reduce((acc, result) => acc + (result?.total || 0), 0);
}

export async function generateLocalQuestions({ projectId, chunks, quota, modelConfig, language }) {
  logger.info(`Executing LOCAL strategy for ${chunks.length} chunks with quota ${quota || 'unlimited'}.`);
  let totalGenerated = 0;

  const processChunk = async (chunk) => {
    const result = await questionService.generateQuestionsForChunkWithGA(projectId, chunk.id, { model: modelConfig, language });
    return { total: result.total };
  };

  totalGenerated = await executeGenerationInParallel(chunks, processChunk, projectId);
  return { total: totalGenerated };
}

export async function generateContextualQuestions({ projectId, chunks, quota, modelConfig, language }) {
  logger.info(`Executing CONTEXTUAL strategy for ${chunks.length} chunks with quota ${quota || 'unlimited'}.`);
  let totalGenerated = 0;
  const quotaPerChunk = quota && chunks.length > 0 ? Math.max(1, Math.floor(quota / chunks.length)) : 3;

  const allChunks = await prisma.chunks.findMany({ where: { projectId }, orderBy: { fileId: 'asc', name: 'asc' } });
  const chunksByFile = allChunks.reduce((acc, chunk) => {
      if (!acc[chunk.fileId]) acc[chunk.fileId] = [];
      acc[chunk.fileId].push(chunk);
      return acc;
  }, {});

  const processChunk = async (chunk) => {
    const fileChunks = chunksByFile[chunk.fileId] || [];
    const currentIndex = fileChunks.findIndex(c => c.id === chunk.id);
    if (currentIndex === -1) return { total: 0 };

    const previousChunk = currentIndex > 0 ? fileChunks[currentIndex - 1] : null;
    const nextChunk = currentIndex < fileChunks.length - 1 ? fileChunks[currentIndex + 1] : null;
    if (!previousChunk && !nextChunk) return { total: 0 };

    const prompt = getContextualQuestionPrompt({
      previousText: previousChunk?.content,
      currentText: chunk.content,
      nextText: nextChunk?.content,
      language: language === 'zh-CN' ? '中文' : 'en',
      number: quotaPerChunk,
    });

    const llmClient = new LLMClient(modelConfig);
    const response = await llmClient.getResponse(prompt);
    const questions = extractJsonFromLLMOutput(response);

    if (!questions || !Array.isArray(questions) || questions.length === 0) return { total: 0 };

    const metadata = {
      type: 'contextual',
      previousChunkId: previousChunk?.id,
      nextChunkId: nextChunk?.id,
    };
    const savedQuestions = await saveQuestions(projectId, questions.map(q => ({ question: q, metadata: JSON.stringify(metadata) })), chunk.id);
    return { total: savedQuestions.length };
  };

  totalGenerated = await executeGenerationInParallel(chunks, processChunk, projectId);
  return { total: totalGenerated };
}

export async function generateGlobalQuestions({ projectId, files, quota, modelConfig, language }) {
  logger.info(`Executing GLOBAL strategy for ${files.length} files with quota ${quota || 'unlimited'}.`);
  let totalGenerated = 0;
  const quotaPerFile = quota && files.length > 0 ? Math.max(1, Math.floor(quota / files.length)) : 5;

  const processFile = async (file) => {
    const toc = await getProjectTocByName(projectId, file.fileName);
    if (!toc || toc.trim() === '') return { total: 0 };

    const firstChunk = await prisma.chunks.findFirst({ where: { fileId: file.id }, orderBy: { name: 'asc' } });
    if (!firstChunk) return { total: 0 };

    const prompt = getGlobalQuestionPrompt({
      toc,
      fileName: file.fileName,
      language: language === 'zh-CN' ? '中文' : 'en',
      number: quotaPerFile,
    });

    const llmClient = new LLMClient(modelConfig);
    const response = await llmClient.getResponse(prompt);
    const questions = extractJsonFromLLMOutput(response);

    if (!questions || !Array.isArray(questions) || questions.length === 0) return { total: 0 };

    const metadata = {
      type: 'global',
      fileId: file.id,
    };
    const savedQuestions = await saveQuestions(projectId, questions.map(q => ({ question: q, isGlobal: true, metadata: JSON.stringify(metadata) })), firstChunk.id);
    return { total: savedQuestions.length };
  };

  totalGenerated = await executeGenerationInParallel(files, processFile, projectId);
  return { total: totalGenerated };
}
