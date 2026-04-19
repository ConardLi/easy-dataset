'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';

export default function useImageDatasetDetails(projectId, datasetId) {
  const router = useRouter();
  const { t } = useTranslation();

  const [currentDataset, setCurrentDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [unconfirming, setUnconfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datasetsAllCount, setDatasetsAllCount] = useState(0);
  const [datasetsConfirmCount, setDatasetsConfirmCount] = useState(0);

  // 获取数据集列表信息
  const fetchDatasetsList = useCallback(async () => {
    try {
      // Use two lightweight requests (pageSize=1) to get total and confirmed counts
      const [allResponse, confirmedResponse] = await Promise.all([
        axios.get(`/api/projects/${projectId}/image-datasets?page=1&pageSize=1&idsOnly=true`),
        axios.get(`/api/projects/${projectId}/image-datasets?page=1&pageSize=1&confirmed=true&idsOnly=true`)
      ]);
      setDatasetsAllCount(allResponse.data.total || 0);
      setDatasetsConfirmCount(confirmedResponse.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch datasets list:', error);
    }
  }, [projectId]);

  // 获取当前数据集详情
  const fetchDatasetDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}/image-datasets/${datasetId}`);
      setCurrentDataset(response.data);
    } catch (error) {
      console.error('Failed to fetch dataset detail:', error);
      toast.error(t('imageDatasets.fetchDetailFailed', '获取详情失败'));
    } finally {
      setLoading(false);
    }
  }, [projectId, datasetId, t]);

  useEffect(() => {
    if (projectId && datasetId) {
      fetchDatasetDetail();
      fetchDatasetsList();
    }
  }, [projectId, datasetId, fetchDatasetDetail, fetchDatasetsList]);

  // 更新数据集
  const updateDataset = useCallback(
    async updates => {
      try {
        setSaving(true);
        await axios.put(`/api/projects/${projectId}/image-datasets/${datasetId}`, updates);
        toast.success(t('imageDatasets.updateSuccess', '更新成功'));
        // 刷新数据
        await fetchDatasetDetail();
        await fetchDatasetsList();
      } catch (error) {
        console.error('Failed to update dataset:', error);
        toast.error(t('imageDatasets.updateFailed', '更新失败'));
      } finally {
        setSaving(false);
      }
    },
    [projectId, datasetId, t, fetchDatasetDetail, fetchDatasetsList]
  );

  // 翻页导航
  const handleNavigate = useCallback(
    async (direction, skipCurrentId = null) => {
      try {
        // Fetch only IDs (no image data) to avoid loading large base64 images for navigation
        const response = await axios.get(
          `/api/projects/${projectId}/image-datasets?page=1&pageSize=10000&idsOnly=true`
        );
        const datasets = response.data.data || [];

        if (datasets.length === 0) {
          router.push(`/projects/${projectId}/image-datasets`);
          return;
        }

        // 确定当前索引
        let currentIndex = -1;
        const searchId = skipCurrentId || datasetId;
        const currentDatasetId = String(searchId);

        // 查找当前数据集的索引
        currentIndex = datasets.findIndex(d => String(d.id) === currentDatasetId);

        // 如果找不到（删除场景或其他原因），从第一个开始
        if (currentIndex === -1) {
          currentIndex = 0;
        }

        // 计算下一个索引
        let nextIndex;
        if (direction === 'prev') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : datasets.length - 1;
        } else {
          nextIndex = currentIndex < datasets.length - 1 ? currentIndex + 1 : 0;
        }

        const nextDataset = datasets[nextIndex];
        if (nextDataset) {
          router.push(`/projects/${projectId}/image-datasets/${nextDataset.id}`);
        }
      } catch (error) {
        console.error('Failed to navigate:', error);
        toast.error(t('common.navigationFailed', '导航失败'));
      }
    },
    [projectId, datasetId, router, t]
  );

  // 确认保留
  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      await updateDataset({ confirmed: true });
      // 确认后导航到下一条
      await handleNavigate('next');
    } finally {
      setConfirming(false);
    }
  }, [updateDataset, handleNavigate]);

  // 取消确认
  const handleUnconfirm = useCallback(async () => {
    setUnconfirming(true);
    try {
      await updateDataset({ confirmed: false });
    } finally {
      setUnconfirming(false);
    }
  }, [updateDataset]);

  // 删除数据集
  const handleDelete = useCallback(async () => {
    if (confirm(t('imageDatasets.deleteConfirm', '确定要删除这个数据集吗？'))) {
      try {
        await axios.delete(`/api/projects/${projectId}/image-datasets/${datasetId}`);
        toast.success(t('imageDatasets.deleteSuccess', '删除成功'));
        // 导航到下一条，传递 datasetId 以便 handleNavigate 知道是删除场景
        await handleNavigate('next', datasetId);
      } catch (error) {
        console.error('Failed to delete dataset:', error);
        toast.error(t('imageDatasets.deleteFailed', '删除失败'));
      }
    }
  }, [projectId, datasetId, handleNavigate, t]);

  return {
    currentDataset,
    loading,
    saving,
    confirming,
    unconfirming,
    datasetsAllCount,
    datasetsConfirmCount,
    updateDataset,
    handleNavigate,
    handleConfirm,
    handleUnconfirm,
    handleDelete
  };
}
