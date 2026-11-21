/**
 * 任务恢复服务
 * 用于在服务启动时检查并恢复未完成的任务
 */
import { EVALUATION_CANCELLING_NOTE, evaluationNote, readEvaluationJournal } from './evaluation-journal';
import { PrismaClient } from '@prisma/client';
import { processAnswerGenerationTask } from './answer-generation';
import { processQuestionGenerationTask } from './question-generation';

const prisma = new PrismaClient();

const recoveryKey = Symbol.for('easy-dataset.taskRecovery');

export function recoverPendingTasks() {
  return (globalThis[recoveryKey] ??= recoverTasks());
}

async function recoverTasks() {
  try {
    console.log('Checking unfinished tasks...');

    // A cancelled evaluation can still be awaiting its final audit write.
    const pendingTasks = await prisma.task.findMany({
      where: {
        OR: [{ status: 0 }, { status: 3, taskType: 'dataset-evaluation', note: EVALUATION_CANCELLING_NOTE }]
      }
    });

    if (pendingTasks.length === 0) {
      console.log('No tasks to recover');
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
              if (task.status === 3) break;
              await prisma.task.updateMany({ where: { id: task.id, status: 0 }, data: {
                status: 2, note: '旧评估任务已中断，请重新发起', endTime: new Date()
              } });
              break;
            }
            const { ids } = JSON.parse(task.modelInfo);
            const recorded = new Map(journal.results.map(row => [row.datasetId, row]));
            const results = ids.map(datasetId => recorded.get(datasetId) ?? {
              datasetId, status: 'unexecuted', apiCompleted: false, writeSucceeded: false, retries: 0,
              error: 'interrupted_before_result'
            });
            await prisma.task.updateMany({ where: { id: task.id, status: task.status, detail: task.detail }, data: {
              status: task.status === 3 ? 3 : 2,
              completedCount: results.filter(row => row.status === 'succeeded' || row.status === 'failed').length,
              detail: JSON.stringify({ ...journal, results }),
              note: evaluationNote(results),
              endTime: task.endTime ?? new Date()
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
  } catch (error) {
    console.error('Task recovery error:', error);
  }
}

// 在模块加载时自动执行恢复
recoverPendingTasks().catch(error => {
  console.error('Failed to run task recovery:', error);
});
