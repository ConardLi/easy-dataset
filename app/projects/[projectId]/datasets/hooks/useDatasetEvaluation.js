'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';

/**
 * 数据集评估相关的自定义 Hook
 * 封装单个评估和批量评估的逻辑
 */
const useDatasetEvaluation = (projectId, onEvaluationComplete) => {
  const router = useRouter();
  const { t } = useTranslation();
  const model = useAtomValue(selectedModelInfoAtom);

  // 评估状态管理
  const [evaluatingIds, setEvaluatingIds] = useState([]);
  const [batchEvaluating, setBatchEvaluating] = useState(false);

  /**
   * 检查模型是否已配置
   */
  const checkModelConfiguration = () => {
    if (!model || !model.modelName) {
      toast.error(t('datasets.selectModelFirst', '请先选择模型'));
      return false;
    }
    return true;
  };

  /**
   * 处理单个数据集评估
   * @param {Object} dataset - 要评估的数据集对象
   */
  const handleEvaluateDataset = async dataset => {
    // 检查模型配置
    if (!checkModelConfiguration()) {
      return;
    }

    try {
      // 添加到评估中的ID列表
      setEvaluatingIds(prev => [...prev, dataset.id]);

      // 调用评估接口
      const evaluateResponse = await fetch(`/api/projects/${projectId}/datasets/${dataset.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          language: 'zh-CN'
        })
      });

      const result = await evaluateResponse.json();

      if (result.success) {
        toast.success(
          t('datasets.evaluateSuccess', '评估完成！评分：{{score}}/5', {
            score: result.data.score
          })
        );

        // 调用回调函数通知评估完成（通常用于刷新数据列表）
        if (onEvaluationComplete) {
          await onEvaluationComplete();
        }
      } else {
        toast.error(result.message || t('datasets.evaluateFailed', '评估失败'));
      }
    } catch (error) {
      console.error('评估失败:', error);
      toast.error(
        t('datasets.evaluateError', '评估失败: {{error}}', {
          error: error.message
        })
      );
    } finally {
      // 从评估中的ID列表移除
      setEvaluatingIds(prev => prev.filter(id => id !== dataset.id));
    }
  };

  /**
   * 处理批量评估
   */
  const handleBatchEvaluate = async (mode = 'unscored', datasetIds = [], retryTaskId) => {
    // 检查模型配置
    if (!checkModelConfiguration()) {
      return;
    }

    try {
      setBatchEvaluating(true);

      const scope = mode === 'selected' ? { datasetIds } : mode === 'failed' ? { retryTaskId } : {};
      const send = async options => {
        const response = await fetch(`/api/projects/${projectId}/datasets/batch-evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, language: 'zh-CN', mode, ...scope, ...options })
        });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message);
        return body;
      };
      const { count } = await send({ preview: true });
      if (!count) {
        toast.info(t('datasets.noEvaluationTargets', '没有符合条件的数据'));
        return;
      }
      if (!window.confirm(t('datasets.confirmEvaluation', '使用 {{model}} 评估 {{count}} 条数据，可能产生 API 费用。继续？', { model: model.modelName, count }))) return;
      const result = await send({ confirmedCount: count });

      if (result.success) {
        toast.success(t('datasets.batchEvaluateStarted', '批量评估任务已启动，将在后台进行处理'));
        // 跳转到任务页面查看进度
        if (mode === 'failed') await onEvaluationComplete?.();
        else router.push(`/projects/${projectId}/tasks`);
      } else {
        toast.error(result.message || t('datasets.batchEvaluateStartFailed', '启动批量评估失败'));
      }
    } catch (error) {
      console.error('批量评估失败:', error);
      toast.error(
        t('datasets.batchEvaluateFailed', '批量评估失败: {{error}}', {
          error: error.message
        })
      );
    } finally {
      setBatchEvaluating(false);
    }
  };

  /**
   * 检查指定数据集是否正在评估中
   * @param {string} datasetId - 数据集ID
   * @returns {boolean} 是否正在评估中
   */
  const isEvaluating = datasetId => {
    return evaluatingIds.includes(datasetId);
  };

  /**
   * 获取当前正在评估的数据集数量
   * @returns {number} 正在评估的数据集数量
   */
  const getEvaluatingCount = () => {
    return evaluatingIds.length;
  };

  return {
    // 状态
    evaluatingIds,
    batchEvaluating,

    // 方法
    handleEvaluateDataset,
    handleBatchEvaluate,

    // 工具方法
    isEvaluating,
    getEvaluatingCount,

    // 模型信息（便于组件使用）
    model
  };
};

export default useDatasetEvaluation;
