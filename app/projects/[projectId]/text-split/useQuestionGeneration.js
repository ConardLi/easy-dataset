'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import request from '@/lib/util/request';
import { processInParallel } from '@/lib/util/async';

/**
 * 问题生成的自定义Hook
 * @param {string} projectId - 项目ID
 * @param {Function} onError - 错误处理回调
 * @param {Object} taskSettings - 任务设置
 * @returns {Object} - 问题生成状态和操作方法
 */
export default function useQuestionGeneration(projectId, taskSettings) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
    questionCount: 0
  });

  /**
   * 重置进度状态
   */
  const resetProgress = useCallback(() => {
    setTimeout(() => {
      setProgress({
        total: 0,
        completed: 0,
        percentage: 0,
        questionCount: 0
      });
    }, 1000); // 延迟重置，让用户看到完成的进度
  }, []);

  /**
   * 处理生成问题
   * @param {Array} chunkIds - 文本块ID列表
   * @param {Object} selectedModelInfo - 选定的模型信息
   * @param {Function} setError - 设置错误信息的函数
   * @param {Function} fetchChunks - 刷新文本块列表的函数
   */
  const handleGenerateQuestions = useCallback(
    async (chunkIds, selectedModelInfo, setError, fetchChunks) => {
      try {
        setProcessing(true);
        setError && setError(null);

        // 重置进度状态
        setProgress({
          total: chunkIds.length,
          completed: 0,
          percentage: 0,
          questionCount: 0
        });

        let model = selectedModelInfo;

        // 如果仍然没有模型信息，抛出错误
        if (!model) {
          throw new Error(t('textSplit.selectModelFirst'));
        }

        // 如果是单个文本块，直接调用单个生成接口
        if (chunkIds.length === 1) {
          const chunkId = chunkIds[0];
          // 获取当前语言环境
          const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

          const response = await request(`/api/projects/${projectId}/chunks/${chunkId}/questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, language: currentLanguage })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('textSplit.generateQuestionsFailed', { chunkId }));
          }

          const data = await response.json();
          console.log(t('textSplit.questionsGenerated', { chunkId, total: data.total }));
          setError &&
            setError({
              severity: 'success',
              message: t('textSplit.questionsGeneratedSuccess', {
                total: data.total
              })
            });
        } else {
          // 如果是多个文本块，循环调用单个文本块的问题生成接口
          let totalQuestions = 0;
          let successCount = 0;
          let errorCount = 0;

          // 单个文本块处理函数
          const processChunk = async chunkId => {
            try {
              // 获取当前语言环境
              const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

              const response = await request(
                `/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}/questions`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ model, language: currentLanguage })
                }
              );

              if (!response.ok) {
                const errorData = await response.json();
                console.error(t('textSplit.generateQuestionsForChunkFailed', { chunkId }), errorData.error);
                errorCount++;
                return { success: false, chunkId, error: errorData.error };
              }

              const data = await response.json();
              console.log(t('textSplit.questionsGenerated', { chunkId, total: data.total }));

              // 更新进度状态
              setProgress(prev => {
                const completed = prev.completed + 1;
                const percentage = Math.round((completed / prev.total) * 100);
                const questionCount = prev.questionCount + (data.total || 0);

                return {
                  ...prev,
                  completed,
                  percentage,
                  questionCount
                };
              });

              totalQuestions += data.total || 0;
              successCount++;
              return { success: true, chunkId, total: data.total };
            } catch (error) {
              console.error(t('textSplit.generateQuestionsForChunkError', { chunkId }), error);
              errorCount++;

              // 更新进度状态（即使失败也计入已处理）
              setProgress(prev => {
                const completed = prev.completed + 1;
                const percentage = Math.round((completed / prev.total) * 100);

                return {
                  ...prev,
                  completed,
                  percentage
                };
              });

              return { success: false, chunkId, error: error.message };
            }
          };

          // 并行处理所有文本块，使用任务设置中的并发限制
          await processInParallel(chunkIds, processChunk, taskSettings?.concurrencyLimit || 2);

          // 处理完成后设置结果消息
          if (errorCount > 0) {
            setError &&
              setError({
                severity: 'warning',
                message: t('textSplit.partialSuccess', {
                  successCount,
                  total: chunkIds.length,
                  errorCount
                })
              });
          } else {
            setError &&
              setError({
                severity: 'success',
                message: t('textSplit.allSuccess', {
                  successCount,
                  totalQuestions
                })
              });
          }
        }

        // 刷新文本块列表
        if (fetchChunks) {
          fetchChunks();
        }
      } catch (error) {
        console.error(t('textSplit.generateQuestionsError'), error);
        setError && setError({ severity: 'error', message: error.message });
      } finally {
        setProcessing(false);
        // 重置进度状态
        resetProgress();
      }
    },
    [projectId, t, resetProgress, taskSettings]
  );

  return {
    processing,
    progress,
    setProgress,
    setProcessing,
    handleGenerateQuestions,
    resetProgress
  };
}
