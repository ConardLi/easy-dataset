'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import request from '@/lib/util/request';
import { toast } from 'sonner';

export default function useDataCleaning(projectId) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
    cleanedCount: 0
  });

  const resetProgress = useCallback(() => {
    setTimeout(() => {
      setProgress({
        total: 0,
        completed: 0,
        percentage: 0,
        cleanedCount: 0
      });
    }, 500);
  }, []);

  const handleDataCleaning = useCallback(
    async (chunkIds, selectedModelInfo, fetchChunks) => {
      try {
        if (!chunkIds || chunkIds.length === 0) return;

        if (!selectedModelInfo) {
          throw new Error(t('textSplit.selectModelFirst'));
        }

        setProcessing(true);

        if (chunkIds.length === 1) {
          const chunkId = chunkIds[0];
          const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

          const response = await request(`/api/projects/${projectId}/chunks/${chunkId}/clean`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: selectedModelInfo,
              language: currentLanguage
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('textSplit.dataCleaningFailed', { chunkId }));
          }

          const data = await response.json();
          toast.success(
            t('textSplit.dataCleaningSuccess', {
              originalLength: data.originalLength,
              cleanedLength: data.cleanedLength
            })
          );

          if (fetchChunks) fetchChunks();
          return;
        }

        const response = await request(`/api/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            taskType: 'data-cleaning',
            modelInfo: selectedModelInfo,
            language: i18n.language,
            detail: '批量数据清洗任务',
            note: { chunkIds }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('tasks.createFailed'));
        }

        const data = await response.json();
        if (data?.code !== 0) {
          throw new Error(data?.message || t('tasks.createFailed'));
        }

        toast.success(`${t('tasks.createSuccess')}，${t('tasks.title')}查看进度`);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setProcessing(false);
        resetProgress();
      }
    },
    [projectId, t, resetProgress]
  );

  return {
    processing,
    progress,
    setProgress,
    setProcessing,
    handleDataCleaning,
    resetProgress
  };
}
