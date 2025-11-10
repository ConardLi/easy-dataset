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
  CircularProgress,
  TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import ChatIcon from '@mui/icons-material/Chat';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';
import { toast } from 'sonner';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  // 处理状态
  const [processingQuestions, setProcessingQuestions] = useState({});
  const { generateSingleDataset } = useGenerateDataset();
  // 获取当前选中的模型
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);

  // 获取文本块的标题
  const getChunkTitle = content => {
    const firstLine = content ? content.split('\n')[0].trim() : '';
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2);
    } else if (firstLine.length > 0) {
      return firstLine.length > 200 ? firstLine.substring(0, 200) + '...' : firstLine;
    }
    return '';
  };

  // 检查问题是否被选中
  const isQuestionSelected = questionId => {
    return selectedQuestions.includes(questionId);
  };

  // 处理生成数据集
  const handleGenerateDataset = async (questionId, questionInfo, imageId, imageName) => {
    // 设置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: true
    }));
    await generateSingleDataset({
      projectId,
      questionId,
      questionInfo,
      imageId,
      imageName
    });
    // 重置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: false
    }));
    refreshQuestions();
  };

  // 处理生成多轮对话数据集
  const handleGenerateMultiTurnDataset = async (questionId, questionInfo) => {
    try {
      // 设置处理状态
      setProcessingQuestions(prev => ({
        ...prev,
        [`${questionId}_multi`]: true
      }));

      // 首先检查项目是否配置了多轮对话设置
      const configResponse = await fetch(`/api/projects/${projectId}/tasks`);
      if (!configResponse.ok) {
        throw new Error('获取项目配置失败');
      }

      const config = await configResponse.json();
      const multiTurnConfig = {
        systemPrompt: config.multiTurnSystemPrompt,
        scenario: config.multiTurnScenario,
        rounds: config.multiTurnRounds,
        roleA: config.multiTurnRoleA,
        roleB: config.multiTurnRoleB
      };

      console.log('multiTurnConfig:', multiTurnConfig);

      // 检查是否已配置必要的多轮对话设置
      // 系统提示词是可选的，但场景、角色A、角色B和轮数是必需的
      if (
        !multiTurnConfig.scenario ||
        !multiTurnConfig.roleA ||
        !multiTurnConfig.roleB ||
        !multiTurnConfig.rounds ||
        multiTurnConfig.rounds < 1
      ) {
        toast.error(t('questions.multiTurnNotConfigured', '请先在项目设置中配置多轮对话相关参数'));
        return;
      }

      // 检查是否选中了模型
      if (!selectedModelInfo) {
        toast.error(t('datasets.selectModelFirst', '请先选择模型'));
        return;
      }

      // 调用多轮对话生成API
      const response = await fetch(`/api/projects/${projectId}/dataset-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          ...multiTurnConfig,
          model: selectedModelInfo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '生成多轮对话数据集失败');
      }

      const result = await response.json();
      toast.success(t('questions.multiTurnGenerated', '多轮对话数据集生成成功！'));
    } catch (error) {
      console.error('生成多轮对话数据集失败:', error);
      toast.error(error.message || '生成多轮对话数据集失败');
    } finally {
      // 重置处理状态
      setProcessingQuestions(prev => ({
        ...prev,
        [`${questionId}_multi`]: false
      }));
    }
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
              {t('common.dataSource')}
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
                    {question.datasetCount > 0 ? (
                      <Chip
                        label={t('datasets.answerCount', { count: question.datasetCount })}
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
                  <Tooltip title={getChunkTitle(question.chunk?.content)}>
                    <Chip
                      label={
                        question.imageId
                          ? `Image: ${question.imageName}`
                          : `${t('chunks.title')}: ${question.chunk?.name}`
                      }
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        maxWidth: '100%',
                        textOverflow: 'ellipsis',
                        bgcolor: isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.10)',
                        color: isDark ? '#E0E7FF' : theme.palette.primary.dark,
                        borderColor: 'rgba(99,102,241,0.35)',
                        '& .MuiChip-label': {
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  </Tooltip>
                </Box>

                <Box sx={{ width: 160, display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title={t('common.edit')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onEditQuestion(question)}
                      disabled={processingQuestions[questionKey]}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('datasets.generateDataset')}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        handleGenerateDataset(question.id, question.question, question.imageId, question.imageName)
                      }
                      disabled={processingQuestions[questionKey]}
                    >
                      {processingQuestions[questionKey] ? (
                        <CircularProgress size={16} />
                      ) : (
                        <AutoFixHighIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>

                  {!question.imageId && (
                    <Tooltip title={t('questions.generateMultiTurn', '生成多轮对话')}>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleGenerateMultiTurnDataset(question.id, question.question)}
                        disabled={processingQuestions[`${questionKey}_multi`]}
                      >
                        {processingQuestions[`${questionKey}_multi`] ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ChatIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}

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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, mb: 2 }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{t('common.jumpTo')}:</Typography>
            <TextField
              size="small"
              type="number"
              inputProps={{
                min: 1,
                max: totalQuestions,
                style: { padding: '4px 8px', width: '50px' }
              }}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  const pageNum = parseInt(e.target.value, 10);
                  if (pageNum >= 1 && pageNum <= totalQuestions) {
                    handlePageChange(null, pageNum);
                    e.target.value = '';
                  }
                }
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
