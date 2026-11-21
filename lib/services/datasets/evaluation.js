/**
 * 数据集评估核心服务
 * 从现有的评估接口中抽离核心逻辑，供单个评估和批量评估复用
 */

import { getDatasetsById, updateDatasetEvaluation } from '@/lib/db/datasets';
import { getChunkById } from '@/lib/db/chunks';
import LLMClient from '@/lib/llm/core/index';
import { getDatasetEvaluationTemplate, renderDatasetEvaluationPrompt } from '@/lib/llm/prompts/datasetEvaluation';
import { extractJsonFromLLMOutput } from '@/lib/llm/common/util';

/**
 * 评估单个数据集
 * @param {string} projectId - 项目ID
 * @param {string} datasetId - 数据集ID
 * @param {object} model - 模型配置
 * @param {string} language - 语言
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function evaluateDataset(projectId, datasetId, model, language = 'zh-CN', options = {}) {
  let oldScore = null;
  let apiCompleted = false;
  let retries = 0;
  let error = 'dataset_unavailable';
  try {
    // 1. 获取数据集信息
    const dataset = await getDatasetsById(datasetId);
    if (!dataset) {
      throw new Error('数据集不存在');
    }

    if (dataset.projectId !== projectId) {
      throw new Error('数据集不属于指定项目');
    }

    oldScore = dataset.score;

    // 2. 根据 questionId 获取原始文本块内容
    let chunkContent = dataset.chunkContent || '';

    // 如果数据集中没有 chunkContent，尝试通过 questionId 查找
    if (!chunkContent && dataset.questionId) {
      try {
        // 查找对应的问题，然后获取 chunk 内容
        const { getQuestionById } = await import('@/lib/db/questions');
        const question = await getQuestionById(dataset.questionId);
        if (question && question.chunkId) {
          const chunk = await getChunkById(question.chunkId);
          if (chunk) {
            // 检查是否是蒸馏内容
            if (chunk.name === 'Distilled Content') {
              chunkContent = 'Distilled Content - 没有原始文本参考';
            } else {
              chunkContent = chunk.content;
            }
          }
        }
      } catch (error) {
        console.warn('无法获取原始文本块内容:', error.message);
        chunkContent = dataset.chunkContent || '';
      }
    }

    // 检查是否是蒸馏内容
    if (dataset.chunkName === 'Distilled Content' || chunkContent.includes('Distilled Content')) {
      chunkContent = 'Distilled Content - 没有原始文本参考';
    }

    error = 'prompt_load_failed';
    const template = options.template ?? await getDatasetEvaluationTemplate(language, projectId);
    const prompt = renderDatasetEvaluationPrompt(template, {
      chunkContent, question: dataset.question, answer: dataset.answer
    });
    const client = new LLMClient({ ...model, projectId });
    let answer;
    for (;;) {
      const signal = AbortSignal.timeout(60000);
      try {
        error = 'model_request_failed';
        ({ answer } = await Promise.race([
          client.getResponseWithCOT(prompt, { abortSignal: signal, maxRetries: 0, privateEvaluation: true, recordUsage: options.recordUsage }),
          new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
        ]));
        apiCompleted = true;
        break;
      } catch (requestError) {
        const status = requestError?.statusCode;
        const retryable = signal.aborted || status === 408 || status === 429 || status >= 500;
        if (signal.aborted) error = 'model_timeout';
        if (status === 429) error = 'model_rate_limited';
        if (!retryable || retries === 1 || (options.isActive && !await options.isActive())) throw requestError;
        retries++;
      }
    }

    error = 'invalid_model_result';
    const result = extractJsonFromLLMOutput(answer);
    if (!Number.isFinite(result?.score) || result.score < 0 || result.score > 5 ||
        typeof result.evaluation !== 'string' || !result.evaluation.trim()) {
      throw new Error(error);
    }
    const data = { score: Math.round(result.score * 2) / 2, aiEvaluation: result.evaluation.trim() };

    error = 'database_write_failed';
    if (!options.deferWrite) {
      const saved = await updateDatasetEvaluation(datasetId, data.score, data.aiEvaluation, projectId);
      if (saved.score !== data.score || saved.aiEvaluation !== data.aiEvaluation) throw new Error(error);
    }
    return { success: true, data, oldScore, apiCompleted, retries };
  } catch {
    return { success: false, error, oldScore, apiCompleted, retries };
  }
}

/**
 * 批量评估数据集
 * @param {string} projectId - 项目ID
 * @param {Array<string>} datasetIds - 数据集ID数组
 * @param {object} model - 模型配置
 * @param {string} language - 语言
 * @param {Function} onProgress - 进度回调函数 (current, total) => void
 * @returns {Promise<{success: number, failed: number, results: Array}>}
 */
export async function batchEvaluateDatasets(projectId, datasetIds, model, language = 'zh-CN', onProgress = null) {
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < datasetIds.length; i++) {
    const datasetId = datasetIds[i];

    try {
      const result = await evaluateDataset(projectId, datasetId, model, language);

      if (result.success) {
        successCount++;
        results.push({
          datasetId,
          success: true,
          ...result.data
        });
      } else {
        failedCount++;
        results.push({
          datasetId,
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      failedCount++;
      results.push({
        datasetId,
        success: false,
        error: error.message
      });
    }

    // 调用进度回调
    if (onProgress) {
      onProgress(i + 1, datasetIds.length);
    }

    // 添加小延迟避免过于频繁的API调用
    if (i < datasetIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    results
  };
}
