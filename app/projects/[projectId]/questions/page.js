'use client';

import { useState, useEffect } from 'react';
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
  useTheme,
  Tooltip
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import i18n from '@/lib/i18n';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import QuestionListView from '@/components/questions/QuestionListView';
import QuestionTreeView from '@/components/questions/QuestionTreeView';
import TabPanel from '@/components/text-split/components/TabPanel';
import useTaskSettings from '@/hooks/useTaskSettings';
import QuestionEditDialog from './components/QuestionEditDialog';
import QuestionGenerationDialog from './components/QuestionGenerationDialog';
import { useQuestionEdit } from './hooks/useQuestionEdit';
import axios from 'axios';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';
import request from '@/lib/util/request';

export default function QuestionsPage({ params }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = params;
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [answerFilter, setAnswerFilter] = useState('all'); // 'all', 'answered', 'unanswered'
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);
  const [tags, setTags] = useState([]);
  const model = useAtomValue(selectedModelInfoAtom);
  const { generateMultipleDataset } = useGenerateDataset();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const getQuestionList = async () => {
    try {
      // 获取问题列表
      const questionsResponse = await axios.get(
        `/api/projects/${projectId}/questions?page=${currentPage}&size=10&status=${answerFilter}&input=${searchTerm}`
      );
      if (questionsResponse.status !== 200) {
        throw new Error(t('common.fetchError'));
      }
      setQuestions(questionsResponse.data || {});

      // 获取标签树
      const tagsResponse = await axios.get(`/api/projects/${projectId}/tags`);
      if (tagsResponse.status !== 200) {
        throw new Error(t('common.fetchError'));
      }
      setTags(tagsResponse.data.tags || []);

      setLoading(false);
    } catch (error) {
      console.error(t('common.fetchError'), error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getQuestionList();
  }, [currentPage, answerFilter, debouncedSearchTerm]);

  const [processing, setProcessing] = useState(false);

  const { taskSettings } = useTaskSettings(projectId);

  // 进度状态
  const [progress, setProgress] = useState({
    total: 0, // 总共选择的问题数量
    completed: 0, // 已处理完成的数量
    percentage: 0, // 进度百分比
    datasetCount: 0 // 已生成的数据集数量
  });

  const {
    editDialogOpen,
    editMode,
    editingQuestion,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseDialog,
    handleSubmitQuestion
  } = useQuestionEdit(projectId, updatedQuestion => {
    getQuestionList();
    toast.success(t('questions.operationSuccess'));
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    confirmAction: null
  });
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);

  // 获取所有数据
  useEffect(() => {
    getQuestionList();
  }, [projectId]);

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
  const handleSelectAll = async () => {
    if (selectedQuestions.length > 0) {
      setSelectedQuestions([]);
    } else {
      const response = await axios.get(
        `/api/projects/${projectId}/questions?status=${answerFilter}&input=${searchTerm}&selectedAll=1`
      );
      setSelectedQuestions(response.data.map(dataset => dataset.id));
    }
  };

  const handleBatchGenerateAnswers_backup = async () => {
    if (selectedQuestions.length === 0) {
      toast.warning(t('questions.noQuestionsSelected'));
      return;
    }
    let data = questions.data.filter(question => selectedQuestions.includes(question.id));
    await generateMultipleDataset(projectId, data);
    await getQuestionList();
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
      toast.warning(t('questions.noQuestionsSelected'));
      return;
    }

    if (!model) {
      toast.warning(t('models.configNotFound'));
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

      toast.info(t('questions.batchGenerateStart', { count: selectedQuestions.length }));

      // 单个问题处理函数
      const processQuestion = async questionId => {
        try {
          console.log('开始生成数据集:', { questionId });
          const language = i18n.language === 'zh-CN' ? '中文' : 'en';
          // 调用API生成数据集
          const response = await request(`/api/projects/${projectId}/datasets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              questionId,
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

            return { success: false, questionId, error: errorData.error || t('datasets.generateFailed') };
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
          return { success: true, questionId, data: data.dataset };
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

          return { success: false, questionId, error: error.message };
        }
      };

      // 并行处理所有问题，最多同时处理2个
      const results = await processInParallel(selectedQuestions, processQuestion, taskSettings.concurrencyLimit);

      // 刷新数据
      getQuestionList();

      // 处理完成后设置结果消息
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (failCount > 0) {
        toast.warning(
          t('datasets.partialSuccess', {
            successCount,
            total: selectedQuestions.length,
            failCount
          })
        );
      } else {
        toast.success(t('common.success', { successCount }));
      }
    } catch (error) {
      console.error('生成数据集出错:', error);
      toast.error(error.message || '生成数据集失败');
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

  // 处理删除问题
  const confirmDeleteQuestion = questionId => {
    // 显示确认对话框
    setConfirmDialog({
      open: true,
      title: t('common.confirmDelete'),
      content: t('common.confirmDeleteQuestion'),
      confirmAction: () => executeDeleteQuestion(questionId)
    });
  };

  // 执行删除问题的操作
  const executeDeleteQuestion = async questionId => {
    toast.promise(axios.delete(`/api/projects/${projectId}/questions/${questionId}`), {
      loading: '数据删除中',
      success: data => {
        setSelectedQuestions(prev =>
          prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
        );
        getQuestionList();
        return t('common.deleteSuccess');
      },
      error: error => {
        return error.response?.data?.message || '删除失败';
      }
    });
  };

  // 处理删除问题的入口函数
  const handleDeleteQuestion = questionId => {
    confirmDeleteQuestion(questionId);
  };

  // 处理自动生成数据集
  const handleAutoGenerateDatasets = async () => {
    try {
      if (!model) {
        toast.error(t('questions.selectModelFirst', { defaultValue: '请先选择模型' }));
        return;
      }

      // 调用创建任务接口
      const response = await axios.post(`/api/projects/${projectId}/tasks`, {
        taskType: 'answer-generation',
        modelInfo: model,
        language: i18n.language
      });

      if (response.data?.code === 0) {
        toast.success(t('tasks.createSuccess', { defaultValue: '后台任务已创建，系统将自动处理未生成答案的问题' }));
      } else {
        toast.error(t('tasks.createFailed', { defaultValue: '创建后台任务失败' }));
      }
    } catch (error) {
      console.error('创建任务失败:', error);
      toast.error(t('tasks.createFailed', { defaultValue: '创建任务失败' }) + ': ' + error.message);
    }
  };

  // 处理开始生成问题
  const handleGenerateQuestions = async (generationParams) => {
    try {
      if (!model) {
        toast.error(t('questions.selectModelFirst', { defaultValue: '请先选择模型' }));
        return;
      }

      const response = await axios.post(`/api/projects/${projectId}/tasks`, {
        taskType: 'question-generation',
        params: {
          model: model,
          ...generationParams
        },
        language: i18n.language
      });

      if (response.data?.code === 0) {
        toast.success(t('tasks.createSuccessQuestions', { defaultValue: '问题生成任务已创建，请稍后刷新查看。' }));
      } else {
        toast.error(t('tasks.createFailed', { defaultValue: '创建后台任务失败' }));
      }
    } catch (error) {
       console.error('创建任务失败:', error);
      toast.error(t('tasks.createFailed', { defaultValue: '创建后台任务失败' }) + ': ' + error.message);
    }
  };

  // 确认批量删除问题
  const confirmBatchDeleteQuestions = () => {
    if (selectedQuestions.length === 0) {
      toast.warning('请先选择问题');
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
    toast.promise(
      axios.delete(`/api/projects/${projectId}/questions/batch-delete`, { data: { questionIds: selectedQuestions } }),
      {
        loading: `正在删除 ${selectedQuestions.length} 个问题...`,
        success: data => {
          getQuestionList();
          setSelectedQuestions([]);
          return `成功删除 ${selectedQuestions.length} 个问题`;
        },
        error: error => {
          return error.response?.data?.message || '批量删除问题失败';
        }
      }
    );
  };

  // 处理批量删除问题的入口函数
  const handleBatchDeleteQuestions = () => {
    confirmBatchDeleteQuestions();
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
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
                  {t('questions.generatingProgress', {
                    completed: progress.completed,
                    total: progress.total
                  })}
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
          {t('questions.title')} ({questions.total})
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
            color="secondary"
            startIcon={<AutoFixHighIcon />}
            onClick={() => setGenerationDialogOpen(true)}
          >
            {t('questions.generateQuestionsTitle')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={handleBatchGenerateAnswers}
            disabled={selectedQuestions.length === 0}
          >
            {t('questions.batchGenerate')}
          </Button>

          <Tooltip
            title={t('questions.autoGenerateDatasetTip', {
              defaultValue: '创建后台批量处理任务：自动查询待生成答案的问题并生成答案'
            })}
          >
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoFixHighIcon />}
              onClick={handleAutoGenerateDatasets}
            >
              {t('questions.autoGenerateDataset', { defaultValue: '自动生成数据集' })}
            </Button>
          </Tooltip>
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
                checked={selectedQuestions.length > 0 && selectedQuestions.length === questions?.total}
                indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions?.total}
                onChange={handleSelectAll}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {selectedQuestions.length > 0
                  ? t('questions.selectedCount', { count: selectedQuestions.length })
                  : t('questions.selectAll')}
                (
                {t('questions.totalCount', {
                  count: questions.total
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
            questions={questions.data}
            currentPage={currentPage}
            totalQuestions={Math.ceil(questions.total / pageSize)}
            handlePageChange={(_, newPage) => setCurrentPage(newPage)}
            selectedQuestions={selectedQuestions}
            onSelectQuestion={handleSelectQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onEditQuestion={handleOpenEditDialog}
            refreshQuestions={getQuestionList}
            projectId={projectId}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <QuestionTreeView
            questions={questions.data}
            tags={tags}
            selectedQuestions={selectedQuestions}
            onSelectQuestion={handleSelectQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onEditQuestion={handleOpenEditDialog}
            projectId={projectId}
            searchTerm={searchTerm}
          />
        </TabPanel>
      </Paper>

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

      <QuestionGenerationDialog
        open={generationDialogOpen}
        onClose={() => setGenerationDialogOpen(false)}
        onSubmit={handleGenerateQuestions}
        model={model}
      />

      <QuestionEditDialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitQuestion}
        initialData={editingQuestion}
        tags={tags}
        mode={editMode}
        projectId={projectId}
      />
    </Container>
  );
}
