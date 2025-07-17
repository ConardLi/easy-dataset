import { PrismaClient } from '@prisma/client';
import { processInParallel } from '@/lib/util/async';
import { updateTask } from './index';
import { getTaskConfig } from '@/lib/db/projects';
import {
  generateLocalQuestions,
  generateContextualQuestions,
  generateGlobalQuestions,
} from '@/lib/services/questions/generation-strategies';
import logger from '@/lib/util/logger';

const prisma = new PrismaClient();

/**
 * 处理问题生成任务
 * @param {object} task - 任务对象
 * @returns {Promise<void>}
 */
export async function processQuestionGenerationTask(task) {
  try {
    logger.info(`开始处理问题生成任务: ${task.id}`);

    let modelInfo, strategy, totalSize, proportions;
    try {
      const params = JSON.parse(task.modelInfo);
      modelInfo = params.model;
      strategy = params.strategy || 'local';
      if (strategy === 'smart-mix') {
        totalSize = params.totalSize;
        proportions = params.proportions;
      }
    } catch (error) {
      throw new Error(`任务参数解析失败: ${error.message}`);
    }

    logger.info(`使用策略: ${strategy}`);

    const taskConfig = await getTaskConfig(task.projectId);
    const concurrencyLimit = taskConfig?.concurrencyLimit || 2;
    let totalGeneratedQuestions = 0;

    if (strategy === 'smart-mix') {
      const globalQuota = Math.floor(totalSize * (proportions.global / 100));
      const contextualQuota = Math.floor(totalSize * (proportions.contextual / 100));
      const localQuota = totalSize - globalQuota - contextualQuota;

      const allFiles = await prisma.upload_files.findMany({ where: { projectId: task.projectId } });
      const allChunks = await prisma.chunks.findMany({ where: { projectId: task.projectId, NOT: { name: { contains: 'Distilled Content' } } } });

      const commonParams = { projectId: task.projectId, modelConfig: modelInfo, language: task.language };

      await updateTask(task.id, { totalCount: totalSize });

      // 1. Global questions
      if (globalQuota > 0) {
        await updateTask(task.id, { detail: `生成全局问题 (配额: ${globalQuota})...` });
        const globalResult = await generateGlobalQuestions({ ...commonParams, files: allFiles, quota: globalQuota });
        totalGeneratedQuestions += globalResult.total || 0;
        await updateTask(task.id, { completedCount: totalGeneratedQuestions, detail: `全局问题生成完成，已生成 ${totalGeneratedQuestions} 个。` });
      }

      // 2. Contextual questions
      if (contextualQuota > 0) {
        await updateTask(task.id, { detail: `生成上下文问题 (配额: ${contextualQuota})...` });
        const contextualResult = await generateContextualQuestions({ ...commonParams, chunks: allChunks, quota: contextualQuota });
        totalGeneratedQuestions += contextualResult.total || 0;
        await updateTask(task.id, { completedCount: totalGeneratedQuestions, detail: `上下文问题生成完成，已生成 ${totalGeneratedQuestions} 个。` });
      }

      // 3. Local questions
      if (localQuota > 0) {
        await updateTask(task.id, { detail: `生成局部问题 (配额: ${localQuota})...` });
        const localResult = await generateLocalQuestions({ ...commonParams, chunks: allChunks, quota: localQuota });
        totalGeneratedQuestions += localResult.total || 0;
        await updateTask(task.id, { completedCount: totalGeneratedQuestions, detail: `局部问题生成完成，已生成 ${totalGeneratedQuestions} 个。` });
      }

    } else {
      // Original logic for single strategies
      let processingUnits;
      if (strategy === 'global') {
          const files = await prisma.upload_files.findMany({ where: { projectId: task.projectId } });
          processingUnits = files.map(f => ({ type: 'file', data: f }));
      } else {
          const chunks = await prisma.chunks.findMany({ where: { projectId: task.projectId, NOT: { name: { contains: 'Distilled Content' } } } });
          processingUnits = chunks.map(c => ({ type: 'chunk', data: c }));
      }

      if (processingUnits.length === 0) {
        logger.info(`项目 ${task.projectId} 没有需要处理的单元 (策略: ${strategy})`);
        await updateTask(task.id, { status: 1, note: '没有需要处理的内容' });
        return;
      }

      const totalCount = processingUnits.length;
      await updateTask(task.id, { totalCount, detail: `待处理单元数量: ${totalCount}` });

      let successCount = 0, errorCount = 0;
      const processedFiles = new Set(); // For global strategy to run once per file

      const processUnit = async (unit) => {
        try {
          const latestTask = await prisma.task.findUnique({ where: { id: task.id } });
          if (latestTask.status === 2 || latestTask.status === 3) return;

          let data = { total: 0 };
          const commonParams = { projectId: task.projectId, modelConfig: modelInfo, language: task.language };

          switch (strategy) {
            case 'local':
              data = await generateLocalQuestions({ ...commonParams, chunks: [unit.data] });
              break;
            case 'contextual':
              data = await generateContextualQuestions({ ...commonParams, chunks: [unit.data] });
              break;
            case 'global':
              if (!processedFiles.has(unit.data.id)) {
                  data = await generateGlobalQuestions({ ...commonParams, files: [unit.data] });
                  processedFiles.add(unit.data.id);
              }
              break;
            default: throw new Error(`未知的生成策略: ${strategy}`);
          }

          logger.info(`单元 ${unit.data.id} (策略: ${strategy}) 已生成 ${data.total || 0} 个问题`);
          if (data.total > 0) successCount++;
          totalGeneratedQuestions += data.total || 0;
        } catch (error) {
          logger.error(`处理单元 ${unit.data.id} (策略: ${strategy}) 出错:`, error);
          errorCount++;
        } finally {
          await updateTask(task.id, {
            completedCount: successCount + errorCount,
            detail: `已处理: ${successCount + errorCount}/${totalCount}, 成功: ${successCount}, 失败: ${errorCount}, 共生成问题: ${totalGeneratedQuestions}`,
          });
        }
      };
      await processInParallel(processingUnits, processUnit, concurrencyLimit);
    }

    await updateTask(task.id, { status: 1, detail: `任务完成，共生成 ${totalGeneratedQuestions} 个问题。`, endTime: new Date() });
    logger.info(`问题生成任务 ${task.id} 处理完成`);
  } catch (error) {
    logger.error(`问题生成任务处理失败: ${task.id}`, error);
    await updateTask(task.id, { status: 2, detail: `处理失败: ${error.message}`, note: `处理失败: ${error.message}` });
  }
}
