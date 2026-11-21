import { db } from '@/lib/db';
import { logEvaluationUsage } from '@/lib/llm/usageLogger';
import { updateDatasetEvaluation } from '@/lib/db/datasets';
import { evaluateDataset } from '@/lib/services/datasets/evaluation';
import { getTaskConfig } from '@/lib/db/projects';
import { evaluationNote, readEvaluationJournal } from './evaluation-journal';

export async function processDatasetEvaluationTask(task, evaluationConfig) {
  const { id, projectId, language } = task;
  const journal = readEvaluationJournal(task);
  const where = { id, projectId };
  if (!journal) {
    await db.task.updateMany({ where: { ...where, status: 0 }, data: {
      status: 2, endTime: new Date(), note: '旧任务缺少固定目标，请重新发起评估'
    } });
    return;
  }
  if (journal.claimed) return;
  journal.claimed = true;
  const claim = await db.task.updateMany({
    where: { ...where, status: 0, detail: task.detail },
    data: { detail: JSON.stringify(journal), startTime: new Date() }
  });
  if (!claim.count) return;

  const { ids } = JSON.parse(task.modelInfo);
  const results = new Map();
  const usage = [];
  const isActive = async () => (await db.task.findUnique({ where, select: { status: true } }))?.status === 0;
  // Serialize SQLite writes within this task. The initial conditional UPDATE also locks out cancellation
  // until the score and its execution record have both committed.
  let writes = Promise.resolve();
  function save(datasetId, result) {
    const entry = {
      datasetId, status: result.success ? 'succeeded' : 'failed', oldScore: result.oldScore,
      apiCompleted: result.apiCompleted, retries: result.retries, writeSucceeded: false, error: result.error
    };
    const persist = async () => {
      await db.$transaction(async tx => {
        const lock = await tx.task.updateMany({ where: { ...where, status: 0 }, data: { updateAt: new Date() } });
        if (!lock.count) {
          entry.status = 'cancelled';
          entry.error = 'task_inactive';
          return;
        }
        if (entry.status === 'succeeded') {
          const saved = await updateDatasetEvaluation(datasetId, result.data.score, result.data.aiEvaluation, projectId, result.revision, tx);
          if (!saved) {
            Object.assign(entry, { status: 'failed', error: 'dataset_changed' });
          } else {
            if (saved.score !== result.data.score || saved.aiEvaluation !== result.data.aiEvaluation) {
              throw new Error('Database write verification failed');
            }
            entry.newScore = saved.score;
            entry.writeSucceeded = true;
            entry.evaluatedAt = new Date().toISOString();
          }
        }
        const entries = [...results.values(), entry];
        await tx.task.update({ where, data: {
          completedCount: entries.length, note: evaluationNote(entries), detail: JSON.stringify({ ...journal, results: entries })
        } });
      });
      results.set(datasetId, entry);
    };
    writes = writes.then(async () => {
      try {
        await persist();
      } catch {
        Object.assign(entry, { status: 'failed', error: 'database_write_failed', writeSucceeded: false });
        delete entry.newScore;
        delete entry.evaluatedAt;
        try {
          await persist();
        } catch {
          results.set(datasetId, entry);
        }
      }
    });
    return writes;
  }

  try {
    if (new Set(ids).size !== ids.length || ids.length !== journal.targetCount) throw new Error('Invalid target snapshot');
    if (!evaluationConfig) throw new Error('Evaluation configuration is unavailable');
    const { model, template, revisions } = evaluationConfig;
    const config = await getTaskConfig(projectId);
    const concurrency = Math.max(1, Math.min(ids.length, Math.floor(Number(config.concurrencyLimit)) || 5));
    let next = 0;
    await Promise.allSettled(Array.from({ length: concurrency }, async () => {
      while (next < ids.length) {
        if (!await isActive()) return;
        const datasetId = ids[next++];
        if (datasetId === undefined) return;
        const result = await evaluateDataset(projectId, datasetId, model, language, {
          template, revision: revisions.get(datasetId), deferWrite: true, isActive, recordUsage: entry => usage.push(entry)
        });
        await save(datasetId, result);
      }
    }));
  } catch {
    console.error('Dataset evaluation worker failed', id);
  }

  const entries = ids.map(datasetId => results.get(datasetId) ?? {
    datasetId, status: 'unexecuted', apiCompleted: false, writeSucceeded: false, retries: 0
  });
  const success = entries.length === journal.targetCount && new Set(entries.map(row => row.datasetId)).size === entries.length
    && entries.every(row => row.status === 'succeeded' && row.writeSucceeded);
  const data = {
    endTime: new Date(), completedCount: entries.filter(row => ['succeeded', 'failed'].includes(row.status)).length,
    note: evaluationNote(entries), detail: JSON.stringify({ ...journal, results: entries })
  };
  const updated = await db.task.updateMany({ where: { ...where, status: 0 }, data: { ...data, status: success ? 1 : 2 } });
  if (!updated.count) await db.task.updateMany({ where: { ...where, status: 3 }, data });
  await logEvaluationUsage(usage);
}
