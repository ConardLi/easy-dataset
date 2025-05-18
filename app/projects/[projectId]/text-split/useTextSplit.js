'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

/**
 * 文本分割的自定义Hook
 * @param {string} projectId - 项目ID
 * @param {Function} addChunks - 添加文本块的函数
 * @param {Function} updateTocData - 更新TOC数据的函数
 * @param {Function} fetchChunks - 刷新文本块列表的函数
 * @returns {Object} - 文本分割状态和操作方法
 */
export default function useTextSplit(projectId, addChunks, updateTocData, fetchChunks) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  /**
   * 处理文本分割
   * @param {Array} fileNames - 文件名列表
   * @param {Object} selectedModelInfo - 选定的模型信息
   * @param {Function} setError - 设置错误信息的函数
   * @param {Function} setActiveTab - 设置活动标签的函数
   * @param {string} domainTreeAction - 领域树动作
   */
  const handleSplitText = useCallback(
    async (fileNames, selectedModelInfo, setError, setActiveTab, domainTreeAction = 'rebuild') => {
      try {
        setProcessing(true);
        const language = i18n.language === 'zh-CN' ? '中文' : 'en';
        const response = await fetch(`/api/projects/${projectId}/split`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fileNames, model: selectedModelInfo, language, domainTreeAction })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('textSplit.splitTextFailed'));
        }

        const data = await response.json();

        // 更新文本块列表
        if (typeof addChunks === 'function' && data.chunks) {
          addChunks(data.chunks);
        }

        // 更新目录结构
        if (data.toc && typeof updateTocData === 'function') {
          updateTocData(data.toc);
        }

        // 自动切换到智能分割标签
        if (typeof setActiveTab === 'function') {
          setActiveTab(0);
        }

        // 刷新文本块列表
        if (typeof fetchChunks === 'function') {
          fetchChunks();
        }
      } catch (error) {
        console.error(t('textSplit.splitTextError'), error);
        if (setError) {
          setError({ severity: 'error', message: error.message });
        }
      } finally {
        setProcessing(false);
      }
    },
    [projectId, t, addChunks, updateTocData, fetchChunks]
  );

  /**
   * 处理文件上传成功
   * @param {Array} fileNames - 文件名列表
   * @param {Array} pdfFiles - PDF文件列表
   * @param {Function} handlePdfProcessing - 处理PDF文件的函数
   * @param {Function} setError - 设置错误信息的函数
   * @param {Function} setActiveTab - 设置活动标签的函数
   * @param {string} pdfStrategy - PDF处理策略
   * @param {string} selectedViosnModel - 选定的视觉模型
   * @param {string} domainTreeAction - 领域树动作
   */
  const handleUploadSuccess = useCallback(
    async (
      fileNames,
      pdfFiles,
      handlePdfProcessing,
      selectedModelInfo,
      setError,
      setActiveTab,
      pdfStrategy,
      selectedViosnModel,
      domainTreeAction
    ) => {
      console.log(t('textSplit.fileUploadSuccess'), fileNames);

      // 处理PDF文件
      if (pdfFiles && pdfFiles.length > 0 && typeof handlePdfProcessing === 'function') {
        await handlePdfProcessing(pdfFiles, pdfStrategy, selectedViosnModel, setError);
      }

      // 如果有文件上传成功，自动处理
      if (fileNames && fileNames.length > 0) {
        await handleSplitText(fileNames, selectedModelInfo, setError, setActiveTab, domainTreeAction);
      }
    },
    [t, handleSplitText]
  );

  return {
    processing,
    setProcessing,
    handleSplitText,
    handleUploadSuccess
  };
}
