'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import axios from 'axios';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';

/**
 * 数据集详情页面业务逻辑 Hook
 */
export default function useDatasetDetails(projectId, datasetId) {
  const router = useRouter();
  const [datasets, setDatasets] = useState([]);
  const [currentDataset, setCurrentDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [editingCot, setEditingCot] = useState(false);
  const [answerValue, setAnswerValue] = useState('');
  const [cotValue, setCotValue] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirming, setConfirming] = useState(false);
  const [optimizeDialog, setOptimizeDialog] = useState({
    open: false,
    loading: false
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewChunk, setViewChunk] = useState(null);
  const [datasetsAllCount, setDatasetsAllCount] = useState(0);
  const [datasetsConfirmCount, setDatasetsConfirmCount] = useState(0);
  const model = useAtomValue(selectedModelInfoAtom);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(() => {
    const storedValue = localStorage.getItem('shortcutsEnabled');
    return storedValue !== null ? storedValue === 'true' : false;
  });

  // 获取数据集详情
  const fetchDatasets = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets/${datasetId}`);
      if (!response.ok) throw new Error('获取数据集详情失败');
      const data = await response.json();
      setCurrentDataset(data.datasets);
      setCotValue(data.datasets?.cot);
      setAnswerValue(data.datasets?.answer);
      setDatasetsAllCount(data.total);
      setDatasetsConfirmCount(data.confirmedCount);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 确认并保存数据集
  const handleConfirm = async () => {
    try {
      setConfirming(true);
      const response = await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmed: true
        })
      });

      if (!response.ok) {
        throw new Error('操作失败');
      }

      setCurrentDataset(prev => ({ ...prev, confirmed: true }));

      setSnackbar({
        open: true,
        message: '操作成功',
        severity: 'success'
      });

      // 导航到下一个数据集
      handleNavigate('next');
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '操作失败',
        severity: 'error'
      });
    } finally {
      setConfirming(false);
    }
  };

  // 导航到其他数据集
  const handleNavigate = async direction => {
    const response = await axios.get(`/api/projects/${projectId}/datasets/${datasetId}?operateType=${direction}`);
    if (response.data) {
      router.push(`/projects/${projectId}/datasets/${response.data.id}`);
    } else {
      toast.warning(`已经是${direction === 'next' ? '最后' : '第'}一条数据了`);
    }
  };

  // 保存编辑
  const handleSave = async (field, value) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      const data = await response.json();
      setCurrentDataset(prev => ({ ...prev, [field]: value }));

      setSnackbar({
        open: true,
        message: '保存成功',
        severity: 'success'
      });

      // 重置编辑状态
      if (field === 'answer') setEditingAnswer(false);
      if (field === 'cot') setEditingCot(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '保存失败',
        severity: 'error'
      });
    }
  };

  // 删除数据集
  const handleDelete = async () => {
    if (!confirm('确定要删除这条数据吗？此操作不可撤销。')) return;

    try {
      // 尝试获取下一个数据集，在删除前先确保有可导航的目标
      const nextResponse = await axios.get(`/api/projects/${projectId}/datasets/${datasetId}?operateType=next`);
      const hasNextDataset = !!nextResponse.data;
      const nextDatasetId = hasNextDataset ? nextResponse.data.id : null;

      // 删除当前数据集
      const deleteResponse = await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        throw new Error('删除失败');
      }

      // 导航逻辑：有下一个就跳转下一个，没有则返回列表页
      if (hasNextDataset) {
        router.push(`/projects/${projectId}/datasets/${nextDatasetId}`);
      } else {
        // 没有更多数据集，返回列表页面
        router.push(`/projects/${projectId}/datasets`);
      }

      toast.success('删除成功');
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '删除失败',
        severity: 'error'
      });
    }
  };

  // 优化对话框相关操作
  const handleOpenOptimizeDialog = () => {
    setOptimizeDialog({
      open: true,
      loading: false
    });
  };

  const handleCloseOptimizeDialog = () => {
    if (optimizeDialog.loading) return;
    setOptimizeDialog({
      open: false,
      loading: false
    });
  };

  // 优化操作
  const handleOptimize = async advice => {
    if (!model) {
      setSnackbar({
        open: true,
        message: '请先选择模型，可以在顶部导航栏选择',
        severity: 'error'
      });
      setOptimizeDialog(prev => ({ ...prev, open: false }));
      return;
    }

    try {
      setOptimizeDialog(prev => ({ ...prev, loading: true }));
      const language = i18n.language === 'zh-CN' ? '中文' : 'en';
      const response = await fetch(`/api/projects/${projectId}/datasets/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          datasetId,
          model,
          advice,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '优化失败');
      }

      // 优化成功后，重新查询数据以获取最新状态
      await fetchDatasets();

      setSnackbar({
        open: true,
        message: 'AI智能优化成功',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '优化失败',
        severity: 'error'
      });
    } finally {
      setOptimizeDialog({
        open: false,
        loading: false
      });
    }
  };

  // 查看文本块详情
  const handleViewChunk = async chunkContent => {
    try {
      setViewChunk(chunkContent);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('查看文本块出错', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      setViewDialogOpen(false);
    }
  };

  // 关闭文本块详情对话框
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  // 初始化和快捷键事件
  useEffect(() => {
    fetchDatasets();
  }, [projectId, datasetId]);

  // 快捷键状态变化
  useEffect(() => {
    localStorage.setItem('shortcutsEnabled', shortcutsEnabled);
  }, [shortcutsEnabled]);

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = event => {
      if (!shortcutsEnabled) return;
      switch (event.key) {
        case 'ArrowLeft': // 上一个
          handleNavigate('prev');
          break;
        case 'ArrowRight': // 下一个
          handleNavigate('next');
          break;
        case 'y': // 确认
        case 'Y':
          if (!confirming && currentDataset && !currentDataset.confirmed) {
            handleConfirm();
          }
          break;
        case 'd': // 删除
        case 'D':
          handleDelete();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcutsEnabled, confirming, currentDataset]);

  return {
    loading,
    currentDataset,
    answerValue,
    cotValue,
    editingAnswer,
    editingCot,
    confirming,
    snackbar,
    optimizeDialog,
    viewDialogOpen,
    viewChunk,
    datasetsAllCount,
    datasetsConfirmCount,
    shortcutsEnabled,
    setShortcutsEnabled,
    setSnackbar,
    setAnswerValue,
    setCotValue,
    setEditingAnswer,
    setEditingCot,
    handleNavigate,
    handleConfirm,
    handleSave,
    handleDelete,
    handleOpenOptimizeDialog,
    handleCloseOptimizeDialog,
    handleOptimize,
    handleViewChunk,
    handleCloseViewDialog
  };
}
