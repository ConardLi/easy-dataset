/**
 * 任务服务层入口文件
 * 根据任务类型分配处理函数
 */

import { PrismaClient } from '@prisma/client';
import { TASK } from '@/constant';
import { processQuestionGenerationTask } from './question-generation';
import { processFileProcessingTask } from './file-processing';
import { processAnswerGenerationTask } from './answer-generation';
import { processDataCleaningTask } from './data-cleaning';
import { processDatasetEvaluationTask } from './dataset-evaluation';
import { processMultiTurnGenerationTask } from './multi-turn-generation';
import { processDataDistillationTask } from './data-distillation';
import { processImageQuestionGenerationTask } from './image-question-generation';
import { processImageDatasetGenerationTask } from './image-dataset-generation';
import { processEvalGenerationTask } from './eval-generation';
import { processModelEvaluationTask } from './model-evaluation';
import './recovery';

const prisma = new PrismaClient();

/**
 * 处理异步任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<void>}
 */
export async function processTask(taskId, evaluationConfig) {
  try {
    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      console.error(`Task not found: ${taskId}`);
      return;
    }

    // 如果任务已经完成或失败，不再处理
    if (task.status === TASK.STATUS.COMPLETED || task.status === TASK.STATUS.FAILED) {
      console.log(`Task already finished; skipping: ${taskId}`);
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
      case 'data-cleaning':
        await processDataCleaningTask(task);
        break;
      case 'dataset-evaluation':
        await processDatasetEvaluationTask(task, evaluationConfig);
        break;
      case 'multi-turn-generation':
        await processMultiTurnGenerationTask(task);
        break;
      case 'data-distillation':
        await processDataDistillationTask(task);
        break;
      case 'image-question-generation':
        await processImageQuestionGenerationTask(task);
        break;
      case 'image-dataset-generation':
        await processImageDatasetGenerationTask(task);
        break;
      case 'eval-generation':
        await processEvalGenerationTask(task);
        break;
      case 'model-evaluation':
        await processModelEvaluationTask(task);
        break;
      default:
        console.error(`Unknown task type: ${task.taskType}`);
        await updateTask(taskId, { status: TASK.STATUS.FAILED, note: `Unknown task type: ${task.taskType}` });
    }
  } catch (error) {
    console.error(`Failed to process task: ${taskId}`, String(error));
    await updateTask(taskId, { status: TASK.STATUS.FAILED, note: `Processing failed: ${error.message}` });
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
    console.error(`Failed to update task status: ${taskId}`, error);
    throw error;
  }
}

/**
 * 启动任务处理器
 * 轮询数据库中的待处理任务并执行
 */
export async function startTaskProcessor() {
  try {
    console.log('Starting task processor...');

    // 查找所有处理中的任务
    const pendingTasks = await prisma.task.findMany({
      where: { status: TASK.STATUS.PROCESSING }
    });

    if (pendingTasks.length > 0) {
      console.log(`Found ${pendingTasks.length} pending tasks`);

      // 处理所有待处理任务
      for (const task of pendingTasks) {
        console.log(`Processing task: ${task.id}`);
        processTask(task.id).catch(err => {
          console.error(`Task processing failed: ${task.id}`, err);
        });
      }
    } else {
      console.log('No pending tasks');
    }
  } catch (error) {
    console.error('Failed to start task processor', error);
  }
}
