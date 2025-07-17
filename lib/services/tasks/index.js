/**
 * 任务服务层入口文件
 * 根据任务类型分配处理函数
 */

import { PrismaClient } from '@prisma/client';
import { TASK } from '@/constant';
import { processQuestionGenerationTask } from './question-generation';
import { processAnswerGenerationTask } from './answer-generation';
import { processAnswerValidationTask } from './answer-validation';
import { processFileProcessingTask } from './file-processing';
import './recovery';

const prisma = new PrismaClient();

/**
 * 处理异步任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<void>}
 */
export async function processTask(taskId) {
  try {
    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      console.error(`任务不存在: ${taskId}`);
      return;
    }

    // 如果任务已经完成或失败，不再处理
    if (task.status === TASK.STATUS.COMPLETED || task.status === TASK.STATUS.FAILED) {
      console.log(`任务已处理完成，无需再次执行: ${taskId}`);
      return;
    }

    // 根据任务类型调用相应的处理函数
    switch (task.taskType) {
      case 'question-generation':
        await processQuestionGenerationTask(task);
        break;
      case 'file-processing':
        await processFileProcessingTask(task);
        break;
      case 'answer-generation':
        await processAnswerGenerationTask(task);
        break;
      case 'answer-validation':
        await processAnswerValidationTask(task);
        break;
      case 'data-distillation':
        // 暂未实现
        console.log('数据蒸馏任务暂未实现');
        await updateTask(taskId, { status: 2, note: '数据蒸馏任务暂未实现' });
        break;
      default:
        console.error(`未知任务类型: ${task.taskType}`);
        await updateTask(taskId, { status: TASK.STATUS.FAILED, note: `未知任务类型: ${task.taskType}` });
    }
  } catch (error) {
    console.error(`处理任务失败: ${taskId}`, String(error));
    await updateTask(taskId, { status: TASK.STATUS.FAILED, note: `处理失败: ${error.message}` });
  }
}

/**
 * 更新任务状态
 * @param {string} taskId - 任务ID
 * @param {object} data - 更新数据
 * @returns {Promise<object>} - 更新后的任务
 */
export async function updateTask(taskId, data) {
  try {
    // 如果更新状态为完成或失败，且未提供结束时间，则自动添加
    if ((data.status === TASK.STATUS.COMPLETED || data.status === TASK.STATUS.FAILED) && !data.endTime) {
      data.endTime = new Date();
    }

    // 更新任务
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data
    });

    return updatedTask;
  } catch (error) {
    console.error(`更新任务状态失败: ${taskId}`, error);
    throw error;
  }
}

/**
 * 启动任务处理器
 * 轮询数据库中的待处理任务并执行
 */
export async function startTaskProcessor() {
  try {
    console.log('启动任务处理器...');

    // 查找所有处理中的任务
    const pendingTasks = await prisma.task.findMany({
      where: { status: TASK.STATUS.PROCESSING }
    });

    if (pendingTasks.length > 0) {
      console.log(`发现 ${pendingTasks.length} 个待处理任务`);

      // 处理所有待处理任务
      for (const task of pendingTasks) {
        console.log(`开始处理任务: ${task.id}`);
        processTask(task.id).catch(err => {
          console.error(`任务处理失败: ${task.id}`, err);
        });
      }
    } else {
      console.log('没有待处理的任务');
    }
  } catch (error) {
    console.error('启动任务处理器失败', error);
  }
}
