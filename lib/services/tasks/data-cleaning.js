/**
 * Data cleaning task processor
 */

import { PrismaClient } from '@prisma/client';
import { processInParallel } from '@/lib/util/async';
import { updateTask } from './index';
import { getTaskConfig } from '@/lib/db/projects';
import { cleanDataForChunk } from '@/lib/services/clean';

const prisma = new PrismaClient();

function parseTaskChunkIds(note) {
  if (!note) return [];
  try {
    const parsed = typeof note === 'string' ? JSON.parse(note) : note;
    if (!Array.isArray(parsed?.chunkIds)) return [];
    return [...new Set(parsed.chunkIds.map(id => String(id)).filter(Boolean))];
  } catch {
    return [];
  }
}

export async function processDataCleaningTask(task) {
  try {
    console.log(`Starting data cleaning task: ${task.id}`);

    let modelInfo;
    try {
      modelInfo = JSON.parse(task.modelInfo);
    } catch (error) {
      throw new Error(`Failed to parse model info: ${error.message}`);
    }

    const taskConfig = await getTaskConfig(task.projectId);
    const concurrencyLimit = taskConfig?.concurrencyLimit || 2;
    const targetChunkIds = parseTaskChunkIds(task.note);

    const chunkWhere = {
      projectId: task.projectId,
      NOT: {
        name: {
          in: ['Image Chunk', 'Distilled Content']
        }
      }
    };

    if (targetChunkIds.length > 0) {
      chunkWhere.id = { in: targetChunkIds };
    }

    const chunks = await prisma.chunks.findMany({ where: chunkWhere });

    if (chunks.length === 0) {
      await updateTask(task.id, {
        status: 1,
        completedCount: 0,
        totalCount: 0,
        note: 'No chunks require cleaning'
      });
      return;
    }

    const totalCount = chunks.length;
    await updateTask(task.id, {
      totalCount,
      detail: `Chunks to process: ${totalCount}`
    });

    let successCount = 0;
    let errorCount = 0;
    let totalOriginalLength = 0;
    let totalCleanedLength = 0;
    let latestTaskStatus = 0;

    const processChunk = async chunk => {
      try {
        const latestTask = await prisma.task.findUnique({ where: { id: task.id } });
        if (latestTask.status === 2 || latestTask.status === 3) {
          latestTaskStatus = latestTask.status;
          return;
        }

        const result = await cleanDataForChunk(task.projectId, chunk.id, {
          model: modelInfo,
          language: task.language === 'zh-CN' ? '中文' : 'en'
        });

        successCount++;
        totalOriginalLength += result.originalLength;
        totalCleanedLength += result.cleanedLength;

        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `Processed: ${successCount + errorCount}/${totalCount}, succeeded: ${successCount}, failed: ${errorCount}, total original length: ${totalOriginalLength}, total cleaned length: ${totalCleanedLength}`
        });

        return { success: true, chunkId: chunk.id, result };
      } catch (error) {
        errorCount++;

        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `Processed: ${successCount + errorCount}/${totalCount}, succeeded: ${successCount}, failed: ${errorCount}, total original length: ${totalOriginalLength}, total cleaned length: ${totalCleanedLength}`
        });

        return { success: false, chunkId: chunk.id, error: error.message };
      }
    };

    await processInParallel(chunks, processChunk, concurrencyLimit);

    if (!latestTaskStatus) {
      const finalStatus = errorCount > 0 && successCount === 0 ? 2 : 1;
      const finalNote = `Processed: ${successCount + errorCount}/${totalCount}, succeeded: ${successCount}, failed: ${errorCount}, total original length: ${totalOriginalLength}, total cleaned length: ${totalCleanedLength}`;

      await updateTask(task.id, {
        status: finalStatus,
        completedCount: successCount + errorCount,
        detail: '',
        note: finalNote,
        endTime: new Date()
      });
    }

    console.log(`Data cleaning task completed: ${task.id}`);
  } catch (error) {
    console.error(`Data cleaning task failed: ${task.id}`, error);
    await updateTask(task.id, {
      status: 2,
      detail: `Processing failed: ${error.message}`,
      note: `Processing failed: ${error.message}`
    });
  }
}
