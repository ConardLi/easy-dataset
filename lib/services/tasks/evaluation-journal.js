export const JOURNAL_VERSION = 1;

export function readEvaluationJournal(task) {
  if (task.taskType !== 'dataset-evaluation') return null;
  try {
    const journal = JSON.parse(task.detail);
    return journal.version === JOURNAL_VERSION ? journal : null;
  } catch {
    return null;
  }
}

export function evaluationSummary(results) {
  const counts = { succeeded: 0, failed: 0, cancelled: 0, unexecuted: 0 };
  for (const { status } of results) counts[status]++;
  return counts;
}

export function evaluationNote(results) {
  const { succeeded, failed, cancelled, unexecuted } = evaluationSummary(results);
  return `Succeeded: ${succeeded}, failed: ${failed}, cancelled: ${cancelled}, not run: ${unexecuted}`;
}

export function publicTask(task) {
  if (task.taskType !== 'dataset-evaluation') return task;
  const { modelInfo, ...visible } = task;
  const journal = readEvaluationJournal(task);
  let model;
  try {
    const info = JSON.parse(modelInfo);
    const { modelId, modelName } = info.model ?? info;
    model = { modelId, modelName };
  } catch {
    model = {};
  }
  return { ...visible, modelInfo: JSON.stringify(model), canRetryEvaluation:
    [2, 3].includes(task.status) && !!journal && journal.results.length === journal.targetCount
      && !!journal?.results.some(row => row.status === 'failed') };
}
