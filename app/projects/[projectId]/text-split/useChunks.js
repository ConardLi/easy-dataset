'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 文本块管理的自定义Hook
 * @param {string} projectId - 项目ID
 * @returns {Object} - 文本块状态和操作方法
 */
export default function useChunks(projectId) {
  const { t } = useTranslation();
  const [chunks, setChunks] = useState([]);
  const [tocData, setTocData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 获取文本块列表
   * @param {string} filter - 筛选条件
   */
  const fetchChunks = useCallback(
    async (filter = 'all') => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/split?filter=${filter}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('textSplit.fetchChunksFailed'));
        }

        const data = await response.json();
        setChunks(data.chunks || []);

        // 如果有文件结果，处理详细信息
        if (data.toc) {
          console.log(t('textSplit.fileResultReceived'), data.fileResult);
          // 如果有目录结构，设置目录数据
          setTocData(data.toc);
        }
      } catch (error) {
        console.error(t('textSplit.fetchChunksError'), error);
        setError({ severity: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    },
    [projectId, t]
  );

  /**
   * 处理删除文本块
   * @param {string} chunkId - 文本块ID
   */
  const handleDeleteChunk = useCallback(
    async chunkId => {
      try {
        const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('textSplit.deleteChunkFailed'));
        }

        // 更新文本块列表
        setChunks(prev => prev.filter(chunk => chunk.id !== chunkId));
      } catch (error) {
        console.error(t('textSplit.deleteChunkError'), error);
        setError({ severity: 'error', message: error.message });
      }
    },
    [projectId, t]
  );

  /**
   * 处理文本块编辑
   * @param {string} chunkId - 文本块ID
   * @param {string} newContent - 新内容
   */
  const handleEditChunk = useCallback(
    async (chunkId, newContent) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: newContent })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('textSplit.editChunkFailed'));
        }

        // 更新成功后刷新文本块列表
        await fetchChunks();

        setError({
          severity: 'success',
          message: t('textSplit.editChunkSuccess')
        });
      } catch (error) {
        console.error(t('textSplit.editChunkError'), error);
        setError({ severity: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    },
    [projectId, t, fetchChunks]
  );

  /**
   * 设置文本块列表
   * @param {Array} data - 新的文本块列表
   */
  const updateChunks = useCallback(data => {
    setChunks(data);
  }, []);

  /**
   * 添加新的文本块
   * @param {Array} newChunks - 新的文本块列表
   */
  const addChunks = useCallback(newChunks => {
    setChunks(prev => {
      const updatedChunks = [...prev];
      newChunks.forEach(chunk => {
        if (!updatedChunks.find(c => c.id === chunk.id)) {
          updatedChunks.push(chunk);
        }
      });
      return updatedChunks;
    });
  }, []);

  /**
   * 设置TOC数据
   * @param {string} toc - TOC数据
   */
  const updateTocData = useCallback(toc => {
    if (toc) {
      setTocData(toc);
    }
  }, []);

  return {
    chunks,
    tocData,
    loading,
    error,
    setError,
    fetchChunks,
    handleDeleteChunk,
    handleEditChunk,
    updateChunks,
    addChunks,
    updateTocData,
    setLoading
  };
}
