'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

/**
 * PDF处理的自定义Hook
 * @param {string} projectId - 项目ID
 * @returns {Object} - PDF处理状态和操作方法
 */
export default function usePdfProcessing(projectId) {
  const { t } = useTranslation();
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
    questionCount: 0
  });
  const [pageProfress, setPageProfress] = useState({
    strategy: 'default',
    taskStatus: 'pending',
    fileIndex: 1,
    total: 0,
    completed: 0,
    percentage: 0
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
   * 处理PDF文件
   * @param {Array} pdfFiles - PDF文件列表
   * @param {string} pdfStrategy - PDF处理策略
   * @param {string} selectedViosnModel - 选定的视觉模型
   * @param {Function} setError - 设置错误信息的函数
   */
  const handlePdfProcessing = useCallback(
    async (pdfFiles, pdfStrategy, selectedViosnModel, setError) => {
      try {
        setPdfProcessing(true);
        setError && setError(null);

        // 重置进度：基于新上传的文件数量
        setProgress({
          total: pdfFiles.length,
          completed: 0,
          percentage: 0,
          questionCount: 0
        });

        const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';
        let fileIndex = 1;
        for (const file of pdfFiles) {
          const response = await fetch(
            `/api/projects/${projectId}/pdf?fileName=${encodeURIComponent(file.name)}&strategy=${pdfStrategy}&currentLanguage=${currentLanguage}&modelId=${selectedViosnModel}`
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(t('textSplit.pdfProcessingFailed') + errorData.error);
          }
          const data = await response.json();
          const taskId = data.result;
          //定时器，循环查询任务状态
          await new Promise(resolve => {
            const interval = setInterval(async () => {
              //查询进度信息
              const taskResponse = await fetch(`/api/task/${taskId}`);
              if (!taskResponse.ok) {
                const errorData = await taskResponse.json();
                clearInterval(interval);
                resolve();
                throw new Error(t('textSplit.pdfProcessingFailed') + errorData.error);
              }
              const taskData = await taskResponse.json();
              //有时候启动任务了，但是等到任务更新进度，就开始查询会导致message为空
              if (taskData.message) {
                const message = JSON.parse(taskData.message);
                // 设置页面进度信息
                setPageProfress({
                  strategy: message.strategy || 'default',
                  taskStatus: message.taskStatus,
                  fileIndex: fileIndex,
                  total: message.total,
                  completed: message.current,
                  percentage: parseInt(taskData.progress)
                });
              }
              //completed标志任务完成
              if (taskData.status === 'completed') {
                clearInterval(interval);
                resolve();
              } else if (taskData.status === 'failed') {
                //failed处理失败，终止当前定时器
                console.error(t('textSplit.pdfProcessingFailed'), taskData.error);
                setError({ severity: 'error', message: taskData.error });
                clearInterval(interval);
                resolve();
              }
            }, 1000);
          });

          // 更新进度状态
          setProgress(prev => {
            const completed = prev.completed + 1;
            const percentage = Math.round((completed / prev.total) * 100);
            return {
              ...prev,
              completed,
              percentage
            };
          });
          //重置页面处理进度
          setPageProfress({
            fileIndex: fileIndex++,
            strategy: 'default',
            taskStatus: 'pending',
            total: 0,
            completed: 0,
            percentage: 0
          });
        }
      } catch (error) {
        console.error(t('textSplit.pdfProcessingFailed'), error);
        setError && setError({ severity: 'error', message: error.message });
      } finally {
        setPdfProcessing(false);
        // 重置进度状态
        resetProgress();
      }
    },
    [projectId, t, resetProgress]
  );

  return {
    pdfProcessing,
    progress,
    pageProfress,
    setPdfProcessing,
    setProgress,
    handlePdfProcessing,
    resetProgress
  };
}
