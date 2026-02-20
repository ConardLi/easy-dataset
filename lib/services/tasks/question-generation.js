/**
 * Question generation task processor
 */

import { PrismaClient } from '@prisma/client';
import { processInParallel } from '@/lib/util/async';
import { updateTask } from './index';
import { getTaskConfig } from '@/lib/db/projects';
import questionService from '@/lib/services/questions';

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

export async function processQuestionGenerationTask(task) {
  try {
    console.log(`Starting question generation task: ${task.id}`);

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

    const chunks = await prisma.chunks.findMany({
      where: chunkWhere,
      include: {
        Questions: true
      }
    });

    // When chunkIds are explicitly provided, process the selected chunks directly.
    // For global auto tasks (no chunkIds), only process chunks without questions.
    const chunksToProcess = targetChunkIds.length > 0 ? chunks : chunks.filter(chunk => chunk.Questions.length === 0);

    if (chunksToProcess.length === 0) {
      await updateTask(task.id, {
        status: 1,
        completedCount: 0,
        totalCount: 0,
        note: 'No chunks require question generation'
      });
      return;
    }

    const totalCount = chunksToProcess.length;
    await updateTask(task.id, {
      totalCount,
      detail: `Chunks to process: ${totalCount}`
    });

    let successCount = 0;
    let errorCount = 0;
    let totalQuestions = 0;
    let latestTaskStatus = 0;
    const errorList = [];

    const processChunk = async chunk => {
      try {
        const latestTask = await prisma.task.findUnique({ where: { id: task.id } });
        if (latestTask.status === 2 || latestTask.status === 3) {
          latestTaskStatus = latestTask.status;
          return;
        }

        const data = await questionService.generateQuestionsForChunkWithGA(task.projectId, chunk.id, {
          model: modelInfo,
          language: task.language === 'zh-CN' ? '中文' : 'en',
          enableGaExpansion: true
        });

        successCount++;
        totalQuestions += data.total || 0;

        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `Processed: ${successCount + errorCount}/${totalCount}, succeeded: ${successCount}, failed: ${errorCount}, questions generated: ${totalQuestions}`
        });

        return { success: true, chunkId: chunk.id, total: data.total || 0 };
      } catch (error) {
        errorCount++;
        const errorMessage = error?.message || String(error);
        errorList.push({ chunkId: chunk.id, error: errorMessage });

        await updateTask(task.id, {
          completedCount: successCount + errorCount,
          detail: `Processed: ${successCount + errorCount}/${totalCount}, succeeded: ${successCount}, failed: ${errorCount}, questions generated: ${totalQuestions}, latest error: ${errorMessage}`
        });

        return { success: false, chunkId: chunk.id, error: errorMessage };
      }
    };

    await processInParallel(chunksToProcess, processChunk, concurrencyLimit);

    if (!latestTaskStatus) {
      const finalStatus = errorCount > 0 && successCount === 0 ? 2 : 1;
      const errorSummary = errorList
        .slice(0, 3)
        .map(item => `[${item.chunkId}] ${item.error}`)
        .join(' | ');
      const finalNote = `Processed: ${successCount + errorCount}/${totalCount}, succeeded: ${successCount}, failed: ${errorCount}, questions generated: ${totalQuestions}${errorSummary ? `, errors: ${errorSummary}` : ''}`;

      await updateTask(task.id, {
        status: finalStatus,
        completedCount: successCount + errorCount,
        detail: errorList.length ? JSON.stringify({ errors: errorList.slice(0, 20) }) : '',
        note: finalNote,
        endTime: new Date()
      });
    }

    console.log(`Question generation task completed: ${task.id}`);
  } catch (error) {
    console.error(`Question generation task failed: ${task.id}`, error);
    await updateTask(task.id, {
      status: 2,
      detail: `Processing failed: ${error.message}`,
      note: `Processing failed: ${error.message}`
    });
  }
}
