'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Checkbox,
  IconButton,
  Chip,
  Tooltip,
  Pagination,
  Divider,
  Paper,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';


export default function QuestionListView({
  questions = [],
  chunks = [],
  selectedQuestions = [],
  onSelectQuestion,
  onDeleteQuestion,
  onGenerateDataset,
  projectId
}) {
  const { t } = useTranslation();
  // 分页状态
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // 批量操作显示提示
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // 处理状态
  const [processingQuestions, setProcessingQuestions] = useState({});

  // 获取文本块的标题
  const getChunkTitle = (chunkId) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return t('chunks.defaultTitle', { id: chunkId });

    // 尝试从内容中提取标题
    const content = chunk.content || '';
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2);
    } else if (firstLine.length > 0) {
      return firstLine.length > 200 ? firstLine.substring(0, 200) + '...' : firstLine;
    }

    return t('chunks.defaultTitle', { id: chunkId });
  };

  // 检查问题是否被选中
  const isQuestionSelected = (questionId, chunkId) => {
    const questionKey = JSON.stringify({ question: questionId, chunkId });
    return selectedQuestions.includes(questionKey);
  };

  // 处理分页变化
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // 处理生成数据集
  const handleGenerateDataset = async (questionId, chunkId) => {
    // 如果没有提供回调函数，则显示提示
    if (!onGenerateDataset) {
      setSnackbarMessage(t('datasets.generateNotImplemented'));
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    const questionKey = JSON.stringify({ question: questionId, chunkId });

    // 设置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionKey]: true
    }));

    try {
      // 调用回调函数生成数据集
      const result = await onGenerateDataset(questionId, chunkId);
      // 显示成功提示
      setSnackbarMessage(t('datasets.generateSuccess', { question: result.question }));
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      // 显示错误提示
      setSnackbarMessage(t('datasets.generateFailed', { error: error.message || t('common.unknownError') }));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      // 清除处理状态
      setProcessingQuestions(prev => {
        const newState = { ...prev };
        delete newState[questionKey];
        return newState;
      });
    }
  };

  // 使用传入的问题列表
  const filteredQuestions = questions;

  // 计算当前页的问题
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);

  return (
    <Box style={{ padding: '20px' }}>
      {/* 问题列表 */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, ml: 1 }}>
            {t('datasets.question')}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {t('common.label')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, width: 150, mr: 2, display: { xs: 'none', md: 'block' } }}>
              {t('chunks.title')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, width: 100, textAlign: 'center' }}>
              {t('common.actions')}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {currentQuestions.map((question, index) => {
          const isSelected = isQuestionSelected(question.question, question.chunkId);
          const questionKey = JSON.stringify({ question: question.question, chunkId: question.chunkId });

          return (
            <Box key={questionKey}>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => {
                    onSelectQuestion(questionKey)
                  }}
                  size="small"
                />

                <Box sx={{ ml: 1, flex: 1, mr: 2 }}>
                  <Typography variant="body2">
                    {question.question}
                    {
                      question.dataSites && question.dataSites.length > 0 ? (
                        <Chip
                          label={t('datasets.answerCount', { count: question.dataSites.length })}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem', maxWidth: 150 }}
                        />
                      ) : null
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                    {question.label || t('datasets.noTag')} • ID: {(question.question || '').substring(0, 8)}
                  </Typography>
                </Box>

                <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
                  {question.label ? (
                    <Chip
                      label={question.label}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', maxWidth: 150 }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.disabled">{t('datasets.noTag')}</Typography>
                  )}
                </Box>

                <Box sx={{ width: 150, mr: 2, display: { xs: 'none', md: 'block' } }}>
                  <Tooltip title={getChunkTitle(question.chunkId)}>
                    <Chip
                      label={question.chunkId}
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{
                        fontSize: '0.75rem',
                        maxWidth: '100%',
                        textOverflow: 'ellipsis'
                      }}
                    />
                  </Tooltip>
                </Box>

                <Box sx={{ width: 100, display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title={t('datasets.generateDataset')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleGenerateDataset(question.question, question.chunkId)}
                      disabled={processingQuestions[questionKey]}
                    >
                      {processingQuestions[questionKey] ? (
                        <CircularProgress size={16} />
                      ) : (
                        <AutoFixHighIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteQuestion(question.question, question.chunkId)}
                      disabled={processingQuestions[questionKey]}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {index < currentQuestions.length - 1 && <Divider />}
            </Box>
          );
        })}
      </Paper>

      {/* 分页 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            shape="rounded"
            size="medium"
          />
        </Box>
      )}

      {/* 操作提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}