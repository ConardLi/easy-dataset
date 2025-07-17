'use server';

import { db } from '@/lib/db/index';
import { verifyTraceability } from '@/lib/services/validation/traceability';
import { updateTask } from './index';
import logger from '@/lib/util/logger';

/**
 * Processes a single answer validation task.
 * @param {object} task - The task object from the database.
 * @returns {Promise<void>}
 */
export async function processAnswerValidationTask(task) {
  const taskId = task.id;
  logger.info(`Processing answer validation task: ${taskId}`);

  try {
    const params = JSON.parse(task.note);
    const { datasetId } = params;

    if (!datasetId) {
      throw new Error('datasetId not found in task parameters');
    }

    await updateTask(taskId, {
      totalCount: 1,
      completedCount: 0,
      detail: `Verifying dataset ${datasetId}...`
    });

    await verifyTraceability(datasetId);

    await updateTask(taskId, {
      status: 1, // Completed
      completedCount: 1,
      detail: `Verification for dataset ${datasetId} complete.`
    });

    logger.info(`Answer validation task ${taskId} completed successfully.`);

  } catch (error) {
    logger.error(`Failed to process answer validation task ${taskId}:`, error);
    await updateTask(taskId, {
      status: 2, // Failed
      detail: `Failed: ${error.message}`,
    });
  }
}
