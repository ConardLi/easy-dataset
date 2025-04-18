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
import useTaskSettings from '@/hooks/useTaskSettings';
import QuestionEditDialog from './components/QuestionEditDialog';
import { useQuestionEdit } from './hooks/useQuestionEdit';
import axios from 'axios';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';

export default function QuestionsPage({ params }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = params;

  const [loading, setLoading] = useState(true);
  // 问题数据
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
  const handleSelectAll = () => {
    if (selectedQuestions.length > 0) {
      setSelectedQuestions([]);
    } else {
      const filteredQuestions = questions.data.filter(question => {
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

      const filteredQuestionKeys = filteredQuestions.map(question => question.id);
      setSelectedQuestions(filteredQuestionKeys);
    }
  };

  const handleBatchGenerateAnswers = async () => {
    if (selectedQuestions.length === 0) {
      toast.warning(t('questions.noQuestionsSelected'));
      return;
    }
    let data = questions.data.filter(question => selectedQuestions.includes(question.id));
    await generateMultipleDataset(projectId, data);
    await getQuestionList();
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
