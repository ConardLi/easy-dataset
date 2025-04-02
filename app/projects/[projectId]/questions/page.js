'use client';

import {useState, useEffect, useCallback} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Checkbox,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import i18n from '@/lib/i18n';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import QuestionListView from '@/components/questions/QuestionListView';
import QuestionTreeView from '@/components/questions/QuestionTreeView';
import TabPanel from '@/components/text-split/components/TabPanel';
import request from '@/lib/util/request';
import useTaskSettings from '@/hooks/useTaskSettings';
import QuestionEditDialog from './components/QuestionEditDialog';
import { useQuestionEdit } from './hooks/useQuestionEdit';
import { useSnackbar } from '@/hooks/useSnackbar';
import {filter} from "framer-motion/m";

export default function QuestionsPage({ params }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [tags, setTags] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [answerFilter, setAnswerFilter] = useState('all'); // 'all', 'answered', 'unanswered'
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { taskSettings } = useTaskSettings(projectId);

  // 进度状态
  const [progress, setProgress] = useState({
    total: 0, // 总共选择的问题数量
    completed: 0, // 已处理完成的数量
    percentage: 0, // 进度百分比
    datasetCount: 0 // 已生成的数据集数量
  });

  const { showSuccess, SnackbarComponent } = useSnackbar();

  const {
    editDialogOpen,
    editMode,
    editingQuestion,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseDialog,
    handleSubmitQuestion
  } = useQuestionEdit(projectId, updatedQuestion => {
    // 直接更新 questions 数组中的数据
    setQuestions(prevQuestions => {
      if (editMode === 'create') {
        return [...prevQuestions, updatedQuestion];
      } else {
        return prevQuestions.map(q => (q.question === editingQuestion.question ? updatedQuestion : q));
      }
    });

    showSuccess(t('questions.operationSuccess'));
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    confirmAction: null
  });

  const fetchData = async currentPage => {
    if (!currentPage) {
      setLoading(true);
    }
    try {
      // 获取标签树
      const tagsResponse = await fetch(`/api/projects/${projectId}/tags`);
      if (!tagsResponse.ok) {
        throw new Error(t('common.fetchError'));
      }
      const tagsData = await tagsResponse.json();
      setTags(tagsData.tags || []);

      await getQuestions();
      // 获取文本块列表
      const response = await fetch(`/api/projects/${projectId}/split`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('common.fetchError'));
      }
      const data = await response.json();
      setChunks(data.chunks || []);
    } catch (error) {
      console.error(t('common.fetchError'), error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      if (!currentPage) {
        setLoading(false);
      }
    }
  };

  const getQuestions = useCallback(async () => {
    // 获取问题列表
    const questionsResponse = await fetch(`/api/projects/${projectId}/questions?page=${page}&limit=${limit}&filter=${answerFilter}&q=${searchTerm}`);
    if (!questionsResponse.ok) {
      throw new Error(t('common.fetchError'));
    }
    const questionsData = await questionsResponse.json();
    setQuestions(questionsData.data || []);
    setTotalQuestions(questionsData.total)
    setTotalPages(questionsData.totalPages)
  }, [projectId, page, limit, answerFilter, searchTerm, t]);

  // 获取所有数据
  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    (async () => {
      await getQuestions();

    })()
  }, [answerFilter,  searchTerm, page])

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 处理问题选择
  const handleSelectQuestion = (questionKey, newSelected) => {
    if (newSelected) {
      // 处理批量选择的情况
      setSelectedQuestions(newSelected);
    } else {
      // 处理单个问题选择的情况
      setSelectedQuestions(prev => {
        if (prev.includes(questionKey)) {
          return prev.filter(id => id !== questionKey);
        } else {
          return [...prev, questionKey];
        }
      });
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedQuestions.length > 0) {
      setSelectedQuestions([]);
    } else {
      const filteredQuestions = questions.filter(question => {
        const matchesSearch =
          searchTerm === '' ||
          question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (question.label && question.label.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesAnswerFilter = true;
        if (answerFilter === 'answered') {
          matchesAnswerFilter = question.dataSites && question.dataSites.length > 0;
        } else if (answerFilter === 'unanswered') {
          matchesAnswerFilter = !question.dataSites || question.dataSites.length === 0;
        }

        return matchesSearch && matchesAnswerFilter;
      });

      const filteredQuestionKeys = filteredQuestions.map(question =>
        JSON.stringify({ question: question.question, chunkId: question.chunkId })
      );
      setSelectedQuestions(filteredQuestionKeys);
    }
  };

  // 从本地存储获取模型参数
  const getModelFromLocalStorage = () => {
    if (typeof window === 'undefined') return null;

    try {
      // 从 localStorage 获取当前选择的模型信息
      let model = null;

      // 尝试从 localStorage 获取完整的模型信息
      const modelInfoStr = localStorage.getItem('selectedModelInfo');

      if (modelInfoStr) {
        try {
          model = JSON.parse(modelInfoStr);
        } catch (e) {
          console.error(t('models.parseError'), e);
          return null;
        }
      }

      // 如果没有模型 ID 或模型信息，返回 null
      if (!model) {
        return null;
      }

      return model;
    } catch (error) {
      console.error(t('models.configNotFound'), error);
      return null;
    }
  };

  // 生成单个问题的数据集
  const handleGenerateDataset = async (questionId, chunkId) => {
    try {
      // 获取模型参数
      const model = getModelFromLocalStorage();
      if (!model) {
        setSnackbar({
          open: true,
          message: t('models.configNotFound'),
          severity: 'error'
        });
        return null;
      }

      // 显示处理中提示
      setSnackbar({
        open: true,
        message: t('datasets.generating'),
        severity: 'info'
      });

      // 调用API生成数据集
      const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';
      const response = await request(`/api/projects/${projectId}/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          chunkId,
          model,
          language: currentLanguage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('datasets.generateFailed'));
      }

      const result = await response.json();
      setSnackbar({
        open: false
      });
      fetchData(1);
      return result.dataset;
    } catch (error) {
      console.error(t('datasets.generateError'), error);
      setSnackbar({
        open: true,
        message: error.message || t('datasets.generateFailed'),
        severity: 'error'
      });
      return null;
    }
  };

  // 并行处理数组的辅助函数，限制并发数
  const processInParallel = async (items, processFunction, concurrencyLimit) => {
    const results = [];
    const inProgress = new Set();
    const queue = [...items];

    while (queue.length > 0 || inProgress.size > 0) {
      // 如果有空闲槽位且队列中还有任务，启动新任务
      while (inProgress.size < concurrencyLimit && queue.length > 0) {
        const item = queue.shift();
        const promise = processFunction(item).then(result => {
          inProgress.delete(promise);
          return result;
        });
        inProgress.add(promise);
        results.push(promise);
      }

      // 等待其中一个任务完成
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }

    return Promise.all(results);
  };

  const handleBatchGenerateAnswers = async () => {
    if (selectedQuestions.length === 0) {
      setSnackbar({
        open: true,
        message: t('questions.noQuestionsSelected'),
        severity: 'warning'
      });
      return;
    }

    // 获取模型参数
    const model = getModelFromLocalStorage();
    if (!model) {
      setSnackbar({
        open: true,
        message: t('models.configNotFound'),
        severity: 'error'
      });
      return;
    }

    try {
      setProgress({
        total: selectedQuestions.length,
        completed: 0,
        percentage: 0,
        datasetCount: 0
      });

      // 然后设置处理状态为真，确保进度条显示
      setProcessing(true);

      setSnackbar({
        open: true,
        message: t('questions.batchGenerateStart', { count: selectedQuestions.length }),
        severity: 'info'
      });

      // 单个问题处理函数
      const processQuestion = async key => {
        try {
          // 从问题键中提取 chunkId 和 questionId
          const lastDashIndex = key.lastIndexOf('-');
          if (lastDashIndex === -1) {
            console.error(t('questions.invalidQuestionKey'), key);

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

            return { success: false, key, error: t('questions.invalidQuestionKey') };
          }

          const { question: questionId, chunkId } = JSON.parse(key);

          console.log('开始生成数据集:', { chunkId, questionId });

          const language = i18n.language === 'zh-CN' ? '中文' : 'en';
          // 调用API生成数据集
          const response = await request(`/api/projects/${projectId}/datasets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              questionId,
              chunkId,
              model,
              language
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(t('datasets.generateError'), errorData.error || t('datasets.generateFailed'));

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

            return { success: false, key, error: errorData.error || t('datasets.generateFailed') };
          }

          const data = await response.json();

          // 更新进度状态
          setProgress(prev => {
            const completed = prev.completed + 1;
            const percentage = Math.round((completed / prev.total) * 100);
            const datasetCount = prev.datasetCount + 1;

            return {
              ...prev,
              completed,
              percentage,
              datasetCount
            };
          });

          console.log(`数据集生成成功: ${questionId}`);
          return { success: true, key, data: data.dataset };
        } catch (error) {
          console.error('生成数据集失败:', error);

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

          return { success: false, key, error: error.message };
        }
      };

      // 并行处理所有问题，最多同时处理2个
      const results = await processInParallel(selectedQuestions, processQuestion, taskSettings.concurrencyLimit);

      // 刷新数据
      fetchData(1);

      // 处理完成后设置结果消息
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (failCount > 0) {
        setSnackbar({
          open: true,
          message: t('datasets.partialSuccess', {
            successCount,
            total: selectedQuestions.length,
            failCount
          }),
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: t('common.success', { successCount }),
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('生成数据集出错:', error);
      setSnackbar({
        open: true,
        message: error.message || '生成数据集失败',
        severity: 'error'
      });
    } finally {
      // 延迟关闭处理状态，确保用户可以看到完成的进度
      setTimeout(() => {
        setProcessing(false);
        // 再次延迟重置进度状态
        setTimeout(() => {
          setProgress({
            total: 0,
            completed: 0,
            percentage: 0,
            datasetCount: 0
          });
        }, 500);
      }, 2000); // 延迟关闭处理状态，让用户看到完成的进度
    }
  };

  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 处理删除问题
  const confirmDeleteQuestion = (questionId, chunkId) => {
    // 根据 questionId 找到对应的问题对象
    const question = questions.find(q => q.question === questionId && q.chunkId === chunkId);
    const questionText = question ? question.question : questionId;

    // 显示确认对话框
    setConfirmDialog({
      open: true,
      title: t('common.confirmDelete'),
      content: t('common.confirmDeleteQuestion'),
      confirmAction: () => executeDeleteQuestion(questionId, chunkId)
    });
  };

  // 执行删除问题的操作
  const executeDeleteQuestion = async (questionId, chunkId) => {
    try {
      // 显示删除中的提示
      setSnackbar({
        open: true,
        message: t('common.deleting'),
        severity: 'info'
      });

      // 调用删除问题的 API
      const response = await fetch(`/api/projects/${projectId}/questions/${encodeURIComponent(questionId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chunkId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除问题失败');
      }

      // 从列表中移除已删除的问题
      setQuestions(prev => prev.filter(q => !(q.question === questionId && q.chunkId === chunkId)));

      // 从选中列表中移除已删除的问题
      const questionKey = JSON.stringify({ question: questionId, chunkId });
      setSelectedQuestions(prev => prev.filter(id => id !== questionKey));

      // 显示成功提示
      setSnackbar({
        open: true,
        message: t('common.deleteSuccess'),
        severity: 'success'
      });

      await getQuestions();

    } catch (error) {
      console.error('删除问题失败:', error);
      setSnackbar({
        open: true,
        message: error.message || '删除问题失败',
        severity: 'error'
      });
    }
  };

  // 处理删除问题的入口函数
  const handleDeleteQuestion = (questionId, chunkId) => {
    confirmDeleteQuestion(questionId, chunkId);
  };

  // 确认批量删除问题
  const confirmBatchDeleteQuestions = () => {
    if (selectedQuestions.length === 0) {
      setSnackbar({
        open: true,
        message: '请先选择问题',
        severity: 'warning'
      });
      return;
    }

    // 显示确认对话框
    setConfirmDialog({
      open: true,
      title: '确认批量删除问题',
      content: `您确定要删除选中的 ${selectedQuestions.length} 个问题吗？此操作不可恢复。`,
      confirmAction: executeBatchDeleteQuestions
    });
  };

  // 执行批量删除问题
  const executeBatchDeleteQuestions = async () => {
    try {
      // 显示删除中的提示
      setSnackbar({
        open: true,
        message: `正在删除 ${selectedQuestions.length} 个问题...`,
        severity: 'info'
      });

      // 存储成功删除的问题数量
      let successCount = 0;

      // 逐个删除问题，完全模仿单个删除的逻辑
      for (const key of selectedQuestions) {
        try {
          const { question: questionId, chunkId } = JSON.parse(key);

          console.log('开始删除问题:', { chunkId, questionId });

          // 调用删除问题的 API
          const response = await fetch(`/api/projects/${projectId}/questions/${encodeURIComponent(questionId)}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chunkId })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`删除问题失败:`, errorData.error || '删除问题失败');
            continue;
          }

          // 从列表中移除已删除的问题，完全复制单个删除的逻辑
          setQuestions(prev => prev.filter(q => !(q.question === questionId && q.chunkId === chunkId)));

          successCount++;
          console.log(`问题删除成功: ${questionId}`);
        } catch (error) {
          console.error('删除问题失败:', error);
        }
      }

      // 清空选中列表
      setSelectedQuestions([]);

      // 显示成功提示
      setSnackbar({
        open: true,
        message:
          successCount === selectedQuestions.length
            ? `成功删除 ${successCount} 个问题`
            : `删除完成，成功: ${successCount}, 失败: ${selectedQuestions.length - successCount}`,
        severity: successCount === selectedQuestions.length ? 'success' : 'warning'
      });

      await getQuestions();

    } catch (error) {
      console.error('批量删除问题失败:', error);
      setSnackbar({
        open: true,
        message: error.message || '批量删除问题失败',
        severity: 'error'
      });
    }
  };

  // 处理批量删除问题的入口函数
  const handleBatchDeleteQuestions = () => {
    confirmBatchDeleteQuestions();
  };

  // 获取文本块内容
  const getChunkContent = chunkId => {
    const chunk = chunks.find(c => c.id === chunkId);
    return chunk ? chunk.content : '';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <SnackbarComponent />
      {/* 处理中的进度显示 - 全局蒙版样式 */}
      {processing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Paper
            elevation={6}
            sx={{
              width: '90%',
              maxWidth: 500,
              p: 3,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
              {t('datasets.generatingDataset')}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  {progress.percentage}%
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="primary"
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2">
                  {t('questions.generatingProgress', { completed: progress.completed, total: progress.total })}
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                  {t('questions.generatedCount', { count: progress.datasetCount })}
                </Typography>
              </Box>
            </Box>

            <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />

            <Typography variant="body2" color="text.secondary">
              {t('questions.pleaseWait')}
            </Typography>
          </Paper>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('questions.title')} ({totalQuestions})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color={selectedQuestions.length > 0 ? 'error' : 'primary'}
            startIcon={<DeleteIcon />}
            onClick={handleBatchDeleteQuestions}
            disabled={selectedQuestions.length === 0}
          >
            {t('questions.deleteSelected')}
          </Button>

          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
            {t('questions.createQuestion')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={handleBatchGenerateAnswers}
            disabled={selectedQuestions.length === 0}
          >
            {t('questions.batchGenerate')}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Tab label={t('questions.listView')} />
          <Tab label={t('questions.treeView')} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={selectedQuestions.length > 0 && selectedQuestions.length === totalQuestions}
                indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < totalQuestions}
                onChange={handleSelectAll}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {selectedQuestions.length > 0
                  ? t('questions.selectedCount', { count: selectedQuestions.length })
                  : t('questions.selectAll')}
                (
                {t('questions.totalCount', {
                  count: questions.filter(question => {
                    const matchesSearch =
                      searchTerm === '' ||
                      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (question.label && question.label.toLowerCase().includes(searchTerm.toLowerCase()));

                    let matchesAnswerFilter = true;
                    if (answerFilter === 'answered') {
                      matchesAnswerFilter = question.dataSites && question.dataSites.length > 0;
                    } else if (answerFilter === 'unanswered') {
                      matchesAnswerFilter = !question.dataSites || question.dataSites.length === 0;
                    }

                    return matchesSearch && matchesAnswerFilter;
                  }).length
                })}
                )
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                placeholder={t('questions.searchPlaceholder')}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ width: { xs: '100%', sm: 300 } }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
              <Select
                value={answerFilter}
                onChange={e => setAnswerFilter(e.target.value)}
                size="small"
                sx={{
                  width: { xs: '100%', sm: 200 },
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? 'transparent' : 'rgba(0, 0, 0, 0.23)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? 'transparent' : 'rgba(0, 0, 0, 0.87)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    elevation: 2,
                    sx: { mt: 1, borderRadius: 2 }
                  }
                }}
              >
                <MenuItem value="all">{t('questions.filterAll')}</MenuItem>
                <MenuItem value="answered">{t('questions.filterAnswered')}</MenuItem>
                <MenuItem value="unanswered">{t('questions.filterUnanswered')}</MenuItem>
              </Select>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <TabPanel value={activeTab} index={0}>
          <QuestionListView
              totalQuestions={totalQuestions}
              totalPages={totalPages}
              setPage={setPage}
              page={page}
            questions={questions}
            chunks={chunks}
            selectedQuestions={selectedQuestions}
            onSelectQuestion={handleSelectQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onGenerateDataset={handleGenerateDataset}
            onEditQuestion={handleOpenEditDialog}
            projectId={projectId}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <QuestionTreeView
            questions={questions.filter(question => {
              // 搜索词筛选
              const matchesSearch =
                searchTerm === '' ||
                question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (question.label && question.label.toLowerCase().includes(searchTerm.toLowerCase()));

              // 答案状态筛选
              let matchesAnswerFilter = true;
              if (answerFilter === 'answered') {
                matchesAnswerFilter = question.dataSites && question.dataSites.length > 0;
              } else if (answerFilter === 'unanswered') {
                matchesAnswerFilter = !question.dataSites || question.dataSites.length === 0;
              }

              return matchesSearch && matchesAnswerFilter;
            })}
            chunks={chunks}
            tags={tags}
            selectedQuestions={selectedQuestions}
            onSelectQuestion={handleSelectQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onGenerateDataset={handleGenerateDataset}
            onEditQuestion={handleOpenEditDialog}
            projectId={projectId}
          />
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{confirmDialog.content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} color="primary">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              setConfirmDialog({ ...confirmDialog, open: false });
              if (confirmDialog.confirmAction) {
                confirmDialog.confirmAction();
              }
            }}
            color="error"
            variant="contained"
            autoFocus
          >
            {t('common.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      <QuestionEditDialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitQuestion}
        initialData={editingQuestion}
        chunks={chunks}
        tags={tags}
        mode={editMode}
      />
    </Container>
  );
}
