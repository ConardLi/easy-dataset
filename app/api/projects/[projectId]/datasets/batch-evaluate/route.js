import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import LLMClient from '@/lib/llm/core/index';
import { getDatasetEvaluationTemplate } from '@/lib/llm/prompts/datasetEvaluation';
import { processTask } from '@/lib/services/tasks';
import { recoverPendingTasks } from '@/lib/services/tasks/recovery';
import { JOURNAL_VERSION, isRetryableEvaluationResult, readEvaluationJournal } from '@/lib/services/tasks/evaluation-journal';

const reject = (message, status = 400) => NextResponse.json({ success: false, message }, { status });

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { model, language = 'zh-CN', mode = 'unscored', datasetIds, retryTaskId, preview = false, confirmedCount } =
      await request.json();
    if (!projectId || typeof model?.modelId !== 'string' || !model.modelId.trim()) return reject('请选择评估模型');
    if (!['unscored', 'selected', 'all', 'failed'].includes(mode)) return reject('评估范围无效');
    if (mode !== 'selected' && datasetIds !== undefined) return reject('不适用的数据 ID 参数');

    await recoverPendingTasks();

    const where = { projectId };
    let selected;
    if (mode === 'selected') {
      if (!Array.isArray(datasetIds) || !datasetIds.length || datasetIds.some(id => typeof id !== 'string' || !id.trim())) {
        return reject('请勾选需要重新评估的数据');
      }
      selected = new Set(datasetIds);
    }
    if (mode === 'failed') {
      if (typeof retryTaskId !== 'string') return reject('缺少原评估任务');
      const task = await db.task.findFirst({ where: { projectId, id: retryTaskId, status: { in: [2, 3] } } });
      const journal = task && readEvaluationJournal(task);
      if (!journal || journal.results.length !== journal.targetCount) return reject('原任务无完整执行记录');
      selected = new Set(journal.results.filter(isRetryableEvaluationResult).map(result => result.datasetId));
    }
    if (mode === 'unscored') where.aiEvaluation = '';
    const rows = await db.datasets.findMany({ where, select: { id: true, updateAt: true }, orderBy: { id: 'asc' } });
    const targets = rows.filter(row => !selected || selected.has(row.id));
    const ids = targets.map(row => row.id);
    if (mode === 'selected' && selected.size !== ids.length) return reject('选中数据已删除或不属于当前项目');
    if (preview === true) return NextResponse.json({ success: true, count: ids.length });
    if ((mode !== 'unscored' || confirmedCount !== undefined) && confirmedCount !== ids.length) {
      return reject('预计评估数量已变化，请重新确认', 409);
    }

    const template = await getDatasetEvaluationTemplate(language, projectId);
    const { provider, model: modelId, temperature, topP, topK, maxTokens } = new LLMClient(model).config;
    const journal = {
      version: JOURNAL_VERSION, mode, targetCount: ids.length, claimed: false,
      promptHash: createHash('sha256').update(template).digest('hex'),
      model: { provider, modelId, temperature, topP, topK, maxTokens },
      results: []
    };
    const task = await db.task.create({
      data: {
        projectId, language, taskType: 'dataset-evaluation', status: 0,
        modelInfo: JSON.stringify({ model: { modelId, modelName: model.modelName }, ids }), detail: JSON.stringify(journal), totalCount: ids.length,
        note: '等待评估'
      }
    });
    processTask(task.id, { model, template, revisions: new Map(targets.map(row => [row.id, row.updateAt])) }).catch(() => console.error('Dataset evaluation dispatch failed', task.id));
    return NextResponse.json({ success: true, data: { taskId: task.id } });
  } catch {
    return reject('无法创建批量评估任务', 500);
  }
}
