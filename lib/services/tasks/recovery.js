/**
 * 任务恢复服务
 * 用于在服务启动时检查并恢复未完成的任务
 */
import { evaluationNote, readEvaluationJournal } from './evaluation-journal';
import { PrismaClient } from '@prisma/client';
import { processAnswerGenerationTask } from './answer-generation';
import { processQuestionGenerationTask } from './question-generation';

const prisma = new PrismaClient();

// 服务初始化标志，确保只执行一次
let initialized = false;

/**
 * 恢复未完成的任务
 * 在应用启动时自动执行一次
 */
export async function recoverPendingTasks() {
  // 如果已经初始化过，直接返回
  if (process.env.INITED) {
    return;
  }

  process.env.INITED = true;

  try {
    console.log('Checking unfinished tasks...');

    // 查找所有处理中的任务
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: 0 // 处理中的任务
      }
    });

    if (pendingTasks.length === 0) {
      console.log('No tasks to recover');
      initialized = true;
      return;
    }

    console.log(`Found ${pendingTasks.length} unfinished tasks, recovering...`);

    // 遍历处理每个任务
    for (const task of pendingTasks) {
      try {
        // 根据任务类型调用对应的处理函数
        switch (task.taskType) {
          case 'question-generation':
            // 异步处理，不等待完成
            processQuestionGenerationTask(task).catch(error => {
              console.error(`Failed to recover question generation task ${task.id}:`, error);
            });
            break;
          case 'answer-generation':
            // 异步处理，不等待完成
            processAnswerGenerationTask(task).catch(error => {
              console.error(`Failed to recover answer generation task ${task.id}:`, error);
            });
            break;
          case 'dataset-evaluation': {
            const journal = readEvaluationJournal(task);
            if (!journal) {
              await prisma.task.updateMany({ where: { id: task.id, status: 0 }, data: {
                status: 2, note: '旧评估任务已中断，请重新发起', endTime: new Date()
              } });
              break;
            }
            const { ids } = JSON.parse(task.modelInfo);
            const recorded = new Map(journal.results.map(row => [row.datasetId, row]));
            const results = ids.map(datasetId => recorded.get(datasetId) ?? {
              datasetId, status: 'unexecuted', apiCompleted: false, writeSucceeded: false, retries: 0
            });
            await prisma.task.updateMany({ where: { id: task.id, status: 0 }, data: {
              status: 2, detail: JSON.stringify({ ...journal, results }), note: evaluationNote(results), endTime: new Date()
            } });
            break;
          }
          default:
            console.warn(`Other Task: ${task.taskType}`);
            await prisma.task.update({
              where: { id: task.id },
              data: {
                status: 2,
                detail: `${task.taskType} Error`,
                note: `${task.taskType} Error`,
                endTime: new Date()
              }
            });
        }
      } catch (error) {
        console.error(`Failed to recover task ${task.id}:`, error);
      }
    }

    console.log('Task recovery started; unfinished tasks will continue in the background');
    initialized = true;
  } catch (error) {
    console.error('Task recovery error:', error);
    // 即使出错也标记为已初始化，避免反复尝试
    initialized = true;
  }
}

// 在模块加载时自动执行恢复
recoverPendingTasks().catch(error => {
  console.error('Failed to run task recovery:', error);
});
