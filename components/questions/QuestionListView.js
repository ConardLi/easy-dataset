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
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';

export default function QuestionListView({
  questions = [],
  currentPage,
  totalQuestions = 0,
  handlePageChange,
  selectedQuestions = [],
  onSelectQuestion,
  onDeleteQuestion,
  projectId,
  onEditQuestion,
  refreshQuestions
}) {
  const { t } = useTranslation();
  // 处理状态
  const [processingQuestions, setProcessingQuestions] = useState({});
  const { generateSingleDataset } = useGenerateDataset();

  // 获取文本块的标题
  const getChunkTitle = content => {
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2);
    } else if (firstLine.length > 0) {
      return firstLine.length > 200 ? firstLine.substring(0, 200) + '...' : firstLine;
    }
    return t('chunks.defaultTitle');
  };

  // 检查问题是否被选中
  const isQuestionSelected = questionId => {
    return selectedQuestions.includes(questionId);
  };

  // 处理生成数据集
  const handleGenerateDataset = async (questionId, questionInfo) => {
    // 设置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: true
    }));
    await generateSingleDataset({ projectId, questionId, questionInfo });
    // 重置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: false
    }));
    refreshQuestions();
  };

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
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, width: 150, mr: 2, display: { xs: 'none', md: 'block' } }}
            >
              {t('chunks.title')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, width: 100, textAlign: 'center' }}>
              {t('common.actions')}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {questions.map((question, index) => {
          const isSelected = isQuestionSelected(question.id);
          const questionKey = question.id;
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
                    onSelectQuestion(questionKey);
                  }}
                  size="small"
                />

                <Box sx={{ ml: 1, flex: 1, mr: 2 }}>
                  <Typography variant="body2">
                    {question.question}
                    {question.dataSites && question.dataSites.length > 0 ? (
                      <Chip
                        label={t('datasets.answerCount', { count: question.dataSites.length })}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', maxWidth: 150 }}
                      />
                    ) : null}
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
                    <Typography variant="caption" color="text.disabled">
                      {t('datasets.noTag')}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ width: 150, mr: 2, display: { xs: 'none', md: 'block' } }}>
                  <Tooltip title={getChunkTitle(question.chunk.content)}>
                    <Chip
                      label={question.chunk.name}
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

                <Box sx={{ width: 120, display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title={t('questions.edit')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        onEditQuestion({
                          id: question.id,
                          question: question.question,
                          chunkId: question.chunkId,
                          label: question.label || 'other'
                        })
                      }
                      disabled={processingQuestions[questionKey]}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('datasets.generateDataset')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleGenerateDataset(question.id, question.question)}
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
                      onClick={() => onDeleteQuestion(question.id)}
                      disabled={processingQuestions[questionKey]}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {index < questions.length - 1 && <Divider />}
            </Box>
          );
        })}
      </Paper>

      {/* 分页 */}
      {totalQuestions > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalQuestions}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            shape="rounded"
            size="medium"
          />
        </Box>
      )}
    </Box>
  );
}
