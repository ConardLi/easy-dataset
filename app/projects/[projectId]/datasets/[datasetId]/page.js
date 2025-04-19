'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Chip,
  Divider,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import ChunkViewDialog from '@/components/text-split/ChunkViewDialog';

// 编辑区域组件
const EditableField = ({ label, value, multiline = true, editing, onEdit, onChange, onSave, onCancel, onOptimize }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1 }}>
          {label}
        </Typography>
        {!editing && (
          <>
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            {onOptimize && (
              <IconButton size="small" onClick={onOptimize} color="primary">
                <AutoFixHighIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}
      </Box>
      {editing ? (
        <Box>
          <TextField
            fullWidth
            multiline={multiline}
            rows={multiline ? 10 : 1}
            value={value}
            onChange={onChange}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button size="small" variant="contained" onClick={onSave}>
              {t('common.save')}
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
            p: 2,
            borderRadius: 1
          }}
        >
          {value || t('common.noData')}
        </Typography>
      )}
    </Box>
  );
};

// AI优化对话框组件
const OptimizeDialog = ({ open, onClose, onConfirm, loading }) => {
  const [advice, setAdvice] = useState('');
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm(advice);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('datasets.aiOptimize')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('datasets.aiOptimizeAdvice')}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={advice}
          onChange={e => setAdvice(e.target.value)}
          placeholder={t('datasets.aiOptimizeAdvicePlaceholder')}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!advice.trim() || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('common.loading') : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function DatasetDetailsPage({ params }) {
  const { projectId, datasetId } = params;
  const router = useRouter();
  const [dataset, setDataset] = useState(null);
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
  const theme = useTheme();
  // 获取数据集列表（用于导航）
  const [datasets, setDatasets] = useState([]);
  const { t } = useTranslation();
  const [shortcutsEnabled, setShortcutsEnabled] = useState(() => {
    const storedValue = localStorage.getItem('shortcutsEnabled');
    return storedValue !== null ? storedValue === 'true' : false;
  });

  // 从本地存储获取模型参数
  const getModelFromLocalStorage = () => {
    if (typeof window === 'undefined') return null;

    try {
      let model = null;

      // 尝试从 localStorage 获取完整的模型信息
      const modelInfoStr = localStorage.getItem('selectedModelInfo');

      if (modelInfoStr) {
        try {
          model = JSON.parse(modelInfoStr);
        } catch (e) {
          console.error('解析模型信息失败', e);
          return null;
        }
      }

      return model;
    } catch (error) {
      console.error('获取模型配置失败', error);
      return null;
    }
  };

  // 获取所有数据集
  const fetchDatasets = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets`);
      if (!response.ok) throw new Error(t('datasets.fetchFailed'));
      const data = await response.json();
      setDatasets(data);

      // 找到当前数据集
      const currentDataset = data.find(d => d.id === datasetId);
      if (currentDataset) {
        setDataset(currentDataset);
        setAnswerValue(currentDataset.answer);
        setCotValue(currentDataset.cot || '');
      }
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
        throw new Error(t('common.failed'));
      }

      setDataset(prev => ({ ...prev, confirmed: true }));

      setSnackbar({
        open: true,
        message: t('common.success'),
        severity: 'success'
      });

      // 导航到下一个数据集
      handleNavigate('next');
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || t('common.failed'),
        severity: 'error'
      });
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [projectId, datasetId]);

  // 导航到其他数据集
  const handleNavigate = direction => {
    const currentIndex = datasets.findIndex(d => d.id === datasetId);
    if (currentIndex === -1) return;

    const newIndex =
      direction === 'prev'
        ? (currentIndex - 1 + datasets.length) % datasets.length
        : (currentIndex + 1) % datasets.length;

    const newDataset = datasets[newIndex];
    router.push(`/projects/${projectId}/datasets/${newDataset.id}`);
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
        throw new Error(t('common.failed'));
      }

      const data = await response.json();
      setDataset(prev => ({ ...prev, [field]: value }));

      setSnackbar({
        open: true,
        message: t('common.success'),
        severity: 'success'
      });

      // 重置编辑状态
      if (field === 'answer') setEditingAnswer(false);
      if (field === 'cot') setEditingCot(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || t('common.failed'),
        severity: 'error'
      });
    }
  };

  // 删除数据集
  const handleDelete = async () => {
    if (!confirm(t('datasets.confirmDeleteMessage'))) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(t('common.failed'));
      }

      // 找到当前数据集的索引
      const currentIndex = datasets.findIndex(d => d.id === datasetId);

      // 如果这是最后一个数据集，返回列表页
      if (datasets.length === 1) {
        router.push(`/projects/${projectId}/datasets`);
        return;
      }

      // 计算下一个数据集的索引
      const nextIndex = (currentIndex + 1) % datasets.length;
      // 如果是最后一个，就去第一个
      const nextDataset = datasets[nextIndex] || datasets[0];

      // 导航到下一个数据集
      router.push(`/projects/${projectId}/datasets/${nextDataset.id}`);

      // 更新本地数据集列表
      setDatasets(prev => prev.filter(d => d.id !== datasetId));
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || t('common.failed'),
        severity: 'error'
      });
    }
  };

  // 打开优化对话框
  const handleOpenOptimizeDialog = () => {
    setOptimizeDialog({
      open: true,
      loading: false
    });
  };

  // 关闭优化对话框
  const handleCloseOptimizeDialog = () => {
    if (optimizeDialog.loading) return;
    setOptimizeDialog({
      open: false,
      loading: false
    });
  };

  // 查看文本块详情
  const handleViewChunk = async chunkId => {
    try {
      setViewDialogOpen(true);
      setViewChunk(null);

      const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`);

      if (!response.ok) {
        throw new Error(t('textSplit.fetchChunkFailed'));
      }

      const data = await response.json();
      setViewChunk(data);
    } catch (error) {
      console.error(t('textSplit.fetchChunkError'), error);
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

  // 提交优化请求
  const handleOptimize = async advice => {
    const model = getModelFromLocalStorage();
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

      const data = await response.json();

      // 更新数据集
      setDataset(data.dataset);
      setAnswerValue(data.dataset.answer);
      setCotValue(data.dataset.cot || '');

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

  // 快捷键状态变化
  useEffect(() => {
    localStorage.setItem('shortcutsEnabled', shortcutsEnabled);
  }, [shortcutsEnabled]);

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (event) => {
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
          if (!confirming && !dataset?.confirmed) {
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
  }, [shortcutsEnabled, confirming, dataset]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!dataset) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{t('datasets.noData')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 顶部导航栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<NavigateBeforeIcon />} onClick={() => router.push(`/projects/${projectId}/datasets`)}>
              {t('common.backToList')}
            </Button>
            <Divider orientation="vertical" flexItem />
            <Typography variant="h6">{t('datasets.datasetDetail')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('datasets.stats', {
                total: datasets.length,
                confirmed: datasets.filter(d => d.confirmed).length,
                percentage: Math.round((datasets.filter(d => d.confirmed).length / datasets.length) * 100)
              })}
            </Typography>
          </Box>
          {/* 快捷键启用选项 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">{t('datasets.enableShortcuts')}</Typography>
            <Tooltip title={t('datasets.shortcutsHelp')}>
              <IconButton size="small" color="info">
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>?</Typography>
              </IconButton>
            </Tooltip>
            <Button
              variant={shortcutsEnabled ? 'contained' : 'outlined'}
              onClick={() => setShortcutsEnabled((prev) => !prev)}
            >
              {shortcutsEnabled ? t('common.enabled') : t('common.disabled')}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => handleNavigate('prev')}>
              <NavigateBeforeIcon />
            </IconButton>
            <IconButton onClick={() => handleNavigate('next')}>
              <NavigateNextIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <Button
              variant="contained"
              color="primary"
              disabled={confirming || dataset.confirmed}
              onClick={handleConfirm}
              sx={{ mr: 1 }}
            >
              {confirming ? (
                <CircularProgress size={24} />
              ) : dataset.confirmed ? (
                t('datasets.confirmed')
              ) : (
                t('datasets.confirmSave')
              )}
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 主要内容 */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            {t('datasets.question')}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {dataset.question}
          </Typography>
        </Box>

        <EditableField
          label={t('datasets.answer')}
          value={answerValue}
          editing={editingAnswer}
          onEdit={() => setEditingAnswer(true)}
          onChange={e => setAnswerValue(e.target.value)}
          onSave={() => handleSave('answer', answerValue)}
          onCancel={() => {
            setEditingAnswer(false);
            setAnswerValue(dataset.answer);
          }}
          onOptimize={handleOpenOptimizeDialog}
        />

        <EditableField
          label={t('datasets.cot')}
          value={cotValue}
          editing={editingCot}
          onEdit={() => setEditingCot(true)}
          onChange={e => setCotValue(e.target.value)}
          onSave={() => handleSave('cot', cotValue)}
          onCancel={() => {
            setEditingCot(false);
            setCotValue(dataset.cot || '');
          }}
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            {t('datasets.metadata')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${t('datasets.model')}: ${dataset.model}`} variant="outlined" />
            {dataset.questionLabel && (
              <Chip label={`${t('common.label')}: ${dataset.questionLabel}`} color="primary" variant="outlined" />
            )}
            <Chip
              label={`${t('datasets.createdAt')}: ${new Date(dataset.createdAt).toLocaleString('zh-CN')}`}
              variant="outlined"
            />
            <Tooltip title={t('textSplit.viewChunk')}>
              <Chip
                label={`${t('datasets.chunkId')}: ${dataset.chunkId.substring(0, 12)}...`}
                variant="outlined"
                color="info"
                onClick={() => handleViewChunk(dataset.chunkId)}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
            {dataset.confirmed && (
              <Chip
                label={t('datasets.confirmed')}
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.dark,
                  fontWeight: 'medium'
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* AI优化对话框 */}
      <OptimizeDialog
        open={optimizeDialog.open}
        onClose={handleCloseOptimizeDialog}
        onConfirm={handleOptimize}
        loading={optimizeDialog.loading}
      />

      {/* 文本块详情对话框 */}
      <ChunkViewDialog open={viewDialogOpen} chunk={viewChunk} onClose={handleCloseViewDialog} />
    </Container>
  );
}
