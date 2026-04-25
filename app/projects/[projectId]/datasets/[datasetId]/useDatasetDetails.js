'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [answerValue, setAnswerValue] = useState('');
  const [cotValue, setCotValue] = useState('');
  const [questionValue, setQuestionValue] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirming, setConfirming] = useState(false);
  const [unconfirming, setUnconfirming] = useState(false);
  const [optimizeDialog, setOptimizeDialog] = useState({
    open: false,
    loading: false
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewChunk, setViewChunk] = useState(null);
  const [datasetsAllCount, setDatasetsAllCount] = useState(0);
  const [datasetsConfirmCount, setDatasetsConfirmCount] = useState(0);
  const [answerTokens, setAnswerTokens] = useState(0);
  const [cotTokens, setCotTokens] = useState(0);
  const model = useAtomValue(selectedModelInfoAtom);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(() => {
    const storedValue = localStorage.getItem('shortcutsEnabled');
    return storedValue !== null ? storedValue === 'true' : false;
  });

  // 输入环境判断，避免在输入框/可编辑区域误触快捷键
  const isEditableTarget = el => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag && ['input', 'textarea', 'select'].includes(tag)) return true;
    if (el.isContentEditable) return true;
    // 兼容嵌套的可编辑区域与常见富文本编辑器
    return !!el.closest?.('[contenteditable="true"], .ProseMirror, .ql-editor');
  };

  // 简单节流，避免连续触发
  const lastShortcutRef = useRef(0);

  // 异步获取Token数量
  const fetchTokenCount = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets/${datasetId}/token-count`);
      if (response.ok) {
        const data = await response.json();
        if (data.answerTokens !== undefined) {
          setAnswerTokens(data.answerTokens);
        }
        if (data.cotTokens !== undefined) {
          setCotTokens(data.cotTokens);
        }
      }
    } catch (error) {
      console.error('获取Token数量失败:', error);
      // Token加载失败不阻塞主界面或显示错误提示
    }
  };

  // 获取数据集详情
  const fetchDatasets = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets/${datasetId}`);
      if (!response.ok) throw new Error('获取数据集详情失败');
      const data = await response.json();
      setCurrentDataset(data.datasets);
      setCotValue(data.datasets?.cot);
      setAnswerValue(data.datasets?.answer);
      setQuestionValue(data.datasets?.question);
      setDatasetsAllCount(data.total);
      setDatasetsConfirmCount(data.confirmedCount);

      // 数据加载完成后，异步获取Token数量
      fetchTokenCount();
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

  // 取消确认数据集
  const handleUnconfirm = async () => {
    try {
      setUnconfirming(true);
      const response = await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmed: false
        })
      });

      if (!response.ok) {
        throw new Error('操作失败');
      }

      setCurrentDataset(prev => ({ ...prev, confirmed: false }));

      setSnackbar({
        open: true,
        message: '已取消确认',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '取消确认失败',
        severity: 'error'
      });
    } finally {
      setUnconfirming(false);
    }
  };

  // 导航到其他数据集
  const handleNavigate = async direction => {
    const params = new URLSearchParams({ operateType: direction });

    // Apply active list filters so navigation stays within the filtered set
    try {
      const savedFilters = localStorage.getItem(`datasets-filters-${projectId}`);
      if (savedFilters) {
        const {
          filterConfirmed,
          filterChunkName,
          filterHasCot,
          filterIsDistill,
          filterScoreRange,
          filterCustomTag,
          filterNoteKeyword,
          searchQuery,
          searchField
        } = JSON.parse(savedFilters);

        if (filterConfirmed === 'confirmed') params.set('status', 'confirmed');
        else if (filterConfirmed === 'unconfirmed') params.set('status', 'unconfirmed');

        if (filterChunkName) params.set('chunkName', filterChunkName);
        if (filterHasCot && filterHasCot !== 'all') params.set('hasCot', filterHasCot);
        if (filterIsDistill && filterIsDistill !== 'all') params.set('isDistill', filterIsDistill);
        if (filterScoreRange && (filterScoreRange[0] > 0 || filterScoreRange[1] < 5)) {
          params.set('scoreRange', `${filterScoreRange[0]}-${filterScoreRange[1]}`);
        }
        if (filterCustomTag) params.set('customTag', filterCustomTag);
        if (filterNoteKeyword) params.set('noteKeyword', filterNoteKeyword);
        if (searchQuery) {
          params.set('input', searchQuery);
          params.set('field', searchField || 'question');
        }
      }
    } catch (e) {
      console.error('Failed to read filter conditions for navigation:', e);
    }

    const response = await axios.get(`/api/projects/${projectId}/datasets/${datasetId}?${params}`);
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
      if (field === 'question') setEditingQuestion(false);
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
    setOptimizeDialog(prev => {
      // 如果正在优化，不允许关闭
      if (prev.loading) {
        return prev;
      }
      return {
        open: false,
        loading: false
      };
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
      return;
    }

    // 立即关闭对话框，并设置优化中状态
    setOptimizeDialog(prev => {
      const newState = {
        open: false,
        loading: true
      };
      return newState;
    });

    toast.info('已开始优化，请稍候...');

    // 异步后台处理，不等待结果
    (async () => {
      try {
        const language = i18n.language;
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
        // 优化可能改变了文本内容，重新获取Token计数
        fetchTokenCount();

        toast.success('AI智能优化成功');
      } catch (error) {
        toast.error(error.message);
      } finally {
        setOptimizeDialog({
          open: false,
          loading: false
        });
      }
    })();
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

      // 在输入框或可编辑区域时不触发
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      if (isEditableTarget(event.target) || isEditableTarget(activeEl)) {
        return;
      }

      // 仅要求 Shift 修饰键，降低误触且更简单
      if (!event.shiftKey) return;

      // 简单节流，过滤极短时间内重复触发
      const now = Date.now();
      if (now - (lastShortcutRef.current || 0) < 250) {
        return;
      }
      lastShortcutRef.current = now;

      switch (event.key) {
        case 'ArrowLeft': // 上一个（Shift + ArrowLeft）
          event.preventDefault();
          handleNavigate('prev');
          break;
        case 'ArrowRight': // 下一个（Shift + ArrowRight）
          event.preventDefault();
          handleNavigate('next');
          break;
        case 'y': // 确认（Shift + Y）
        case 'Y':
          if (!confirming && currentDataset && !currentDataset.confirmed) {
            event.preventDefault();
            handleConfirm();
          }
          break;
        case 'd': // 删除（Shift + D）
        case 'D':
          event.preventDefault();
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
    questionValue,
    editingAnswer,
    editingCot,
    editingQuestion,
    confirming,
    unconfirming,
    snackbar,
    optimizeDialog,
    viewDialogOpen,
    viewChunk,
    datasetsAllCount,
    datasetsConfirmCount,
    answerTokens,
    cotTokens,
    shortcutsEnabled,
    setShortcutsEnabled,
    setSnackbar,
    setAnswerValue,
    setCotValue,
    setQuestionValue,
    setEditingAnswer,
    setEditingCot,
    setEditingQuestion,
    handleNavigate,
    handleConfirm,
    handleUnconfirm,
    handleSave,
    handleDelete,
    handleOpenOptimizeDialog,
    handleCloseOptimizeDialog,
    handleOptimize,
    handleViewChunk,
    handleCloseViewDialog
  };
}
