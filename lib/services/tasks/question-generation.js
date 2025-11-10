/**
 * 问题生成任务处理服务
 */

import { PrismaClient } from '@prisma/client';
import { processInParallel } from '@/lib/util/async';
import { updateTask } from './index';
import { getTaskConfig } from '@/lib/db/projects';
import questionService from '@/lib/services/questions';

const prisma = new PrismaClient();
const TASK_REMOVED_FLAG = -1;

/**
 * 处理问题生成任务
 * @param {object} task - 任务对象
 * @returns {Promise<void>}
 */
export async function processQuestionGenerationTask(task) {
  try {
    console.log(`开始处理问题生成任务: ${task.id}`);

    // 解析模型信息
    let modelInfo;
    try {
      modelInfo = JSON.parse(task.modelInfo);
    } catch (error) {
      throw new Error(`模型信息解析失败: ${error.message}`);
    }

    // 获取项目配置
    const taskConfig = await getTaskConfig(task.projectId);
    const concurrencyLimit = taskConfig?.concurrencyLimit || 2;

    // 1. 查询所有未生成问题的文本块（过滤掉名出为 Distilled Content 的文本块）
    const chunks = await prisma.chunks.findMany({
      where: {
        projectId: task.projectId,
        // 过滤掉名称为 Distilled Content 的文本块
        NOT: {
          name: {
            in: ['Image Chunk', 'Distilled Content']
          }
        }
      },
      include: {
        Questions: true
      }
    });

    // 过滤出没有问题的文本块
    const chunksWithoutQuestions = chunks.filter(chunk => chunk.Questions.length === 0);

    if (chunksWithoutQuestions.length === 0) {
      console.log(`项目 ${task.projectId} 没有需要生成问题的文本块`);
      await updateTask(task.id, {
        status: 1,
        completedCount: 0,
        totalCount: 0,
        note: '没有需要生成问题的文本块'
      });
      return;
    }

    // 更新任务总数
    const totalCount = chunksWithoutQuestions.length;
    await updateTask(task.id, {
      totalCount,
      detail: `待处理文本块数量: ${totalCount}`
    });

    // 2. 批量处理每个文本块
    let successCount = 0;
    let errorCount = 0;
    let totalQuestions = 0;
    let latestTaskStatus = 0;

    // 单个文本块处理函数
    const processChunk = async chunk => {
      try {
        // 如果任务已经被标记为失败或已中断，不再继续处理
        const latestTask = await prisma.task.findUnique({ where: { id: task.id } });
        if (!latestTask) {
          latestTaskStatus = TASK_REMOVED_FLAG;
          console.warn(`任务 ${task.id} 已被删除，停止问题生成处理。`);
          return;
        }

        if (latestTask.status === 2 || latestTask.status === 3) {
          latestTaskStatus = latestTask.status;
          return;
        }

        const data = await questionService.generateQuestionsForChunkWithGA(task.projectId, chunk.id, {
          model: modelInfo,
          language: task.language === 'zh-CN' ? '中文' : 'en',
          enableGaExpansion: true // 启用GA扩展
        });
        console.log(`文本块 ${chunk.id} 已生成 ${data.total || 0} 个问题`);

        // 增加成功计数
        successCount++;
        totalQuestions += data.total || 0;

        // 更新任务进度
        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `已处理: ${successCount + errorCount}/${totalCount}, 成功: ${successCount}, 失败: ${errorCount}, 共生成问题: ${totalQuestions}`
        });

        return { success: true, chunkId: chunk.id, total: data.total || 0 };
      } catch (error) {
        console.error(`处理文本块 ${chunk.id} 出错:`, error);
        errorCount++;

        // 更新任务进度
        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `已处理: ${successCount + errorCount}/${totalCount}, 成功: ${successCount}, 失败: ${errorCount}, 共生成问题: ${totalQuestions}`
        });

        return { success: false, chunkId: chunk.id, error: error.message };
      }
    };

    // 并行处理所有文本块，使用任务设置中的并发限制
    await processInParallel(chunksWithoutQuestions, processChunk, concurrencyLimit, async (completed, total) => {
      console.log(`问题生成进度: ${completed}/${total}`);
    });

    if (!latestTaskStatus) {
      // 任务完成，更新状态
      const finalStatus = errorCount > 0 && successCount === 0 ? 2 : 1; // 如果全部失败，标记为失败；否则标记为完成
      await updateTask(task.id, {
        status: finalStatus,
        detail: '',
        note: '',
        endTime: new Date()
      });
    }

    console.log(`问题生成任务 ${task.id} 处理完成`);
  } catch (error) {
    console.error(`问题生成任务处理失败: ${task.id}`, error);
    await updateTask(task.id, {
      status: 2,
      detail: `处理失败: ${error.message}`,
      note: `处理失败: ${error.message}`
    });
  }
}
