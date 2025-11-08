'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  List,
  Checkbox,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
  Divider,
  CircularProgress,
  Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';
import axios from 'axios';

/**
 * 问题树视图组件
 * @param {Object} props
 * @param {Array} props.tags - 标签树
 * @param {Array} props.selectedQuestions - 已选择的问题ID列表
 * @param {Function} props.onSelectQuestion - 选择问题的回调函数
 * @param {Function} props.onDeleteQuestion - 删除问题的回调函数
 */
export default function QuestionTreeView({
  tags = [],
  selectedQuestions = [],
  onSelectQuestion,
  onDeleteQuestion,
  onEditQuestion,
  projectId,
  searchTerm
}) {
  const { t } = useTranslation();
  const [expandedTags, setExpandedTags] = useState({});
  const [questionsByTag, setQuestionsByTag] = useState({});
  const [processingQuestions, setProcessingQuestions] = useState({});
  const { generateSingleDataset } = useGenerateDataset();
  const [questions, setQuestions] = useState([]);
  const [loadedTags, setLoadedTags] = useState({});
  // 初始化时，将所有标签设置为收起状态（而不是展开状态）
  useEffect(() => {
    async function fetchTagsInfo() {
      try {
        // 获取标签信息，仅用于标签统计
        const response = await axios.get(`/api/projects/${projectId}/questions/tree?tagsOnly=true&input=${searchTerm}`);
        setQuestions(response.data); // 设置数据仅用于标签统计

        // 当搜索条件变化时，重新加载已展开标签的问题数据
        const expandedTagLabels = Object.entries(expandedTags)
          .filter(([_, isExpanded]) => isExpanded)
          .map(([label]) => label);

        // 重新加载已展开标签的数据
        for (const label of expandedTagLabels) {
          fetchTagQuestions(label);
        }
      } catch (error) {
        console.error('获取标签信息失败:', error);
      }
    }

    if (projectId) {
      fetchTagsInfo();
    }

    const initialExpandedState = {};
    const processTag = tag => {
      // 将默认状态改为 false（收起）而不是 true（展开）
      initialExpandedState[tag.label] = false;
      if (tag.child && tag.child.length > 0) {
        tag.child.forEach(processTag);
      }
    };

    tags.forEach(processTag);
    // 未分类问题也默认收起
    initialExpandedState['uncategorized'] = false;
    setExpandedTags(initialExpandedState);
  }, [tags]);

  // 根据标签对问题进行分类
  useEffect(() => {
    const taggedQuestions = {};

    // 初始化标签映射
    const initTagMap = tag => {
      taggedQuestions[tag.label] = [];
      if (tag.child && tag.child.length > 0) {
        tag.child.forEach(initTagMap);
      }
    };

    tags.forEach(initTagMap);

    // 将问题分配到对应的标签下
    questions.forEach(question => {
      // 如果问题没有标签，添加到"未分类"
      if (!question.label) {
        if (!taggedQuestions['uncategorized']) {
          taggedQuestions['uncategorized'] = [];
        }
        taggedQuestions['uncategorized'].push(question);
        return;
      }

      // 将问题添加到匹配的标签下
      const questionLabel = question.label;

      // 查找最精确匹配的标签
      // 使用一个数组来存储所有匹配的标签路径，以便找到最精确的匹配
      const findAllMatchingTags = (tag, path = []) => {
        const currentPath = [...path, tag.label];

        // 存储所有匹配结果
        const matches = [];

        // 精确匹配当前标签
        if (tag.label === questionLabel) {
          matches.push({ label: tag.label, depth: currentPath.length });
        }

        // 检查子标签
        if (tag.child && tag.child.length > 0) {
          for (const childTag of tag.child) {
            const childMatches = findAllMatchingTags(childTag, currentPath);
            matches.push(...childMatches);
          }
        }

        return matches;
      };

      // 在所有根标签中查找所有匹配
      let allMatches = [];
      for (const rootTag of tags) {
        const matches = findAllMatchingTags(rootTag);
        allMatches.push(...matches);
      }

      // 找到深度最大的匹配（最精确的匹配）
      let matchedTagLabel = null;
      if (allMatches.length > 0) {
        // 按深度排序，深度最大的是最精确的匹配
        allMatches.sort((a, b) => b.depth - a.depth);
        matchedTagLabel = allMatches[0].label;
      }

      if (matchedTagLabel) {
        // 如果找到匹配的标签，将问题添加到该标签下
        if (!taggedQuestions[matchedTagLabel]) {
          taggedQuestions[matchedTagLabel] = [];
        }
        taggedQuestions[matchedTagLabel].push(question);
      } else {
        // 如果找不到匹配的标签，添加到"未分类"
        if (!taggedQuestions['uncategorized']) {
          taggedQuestions['uncategorized'] = [];
        }
        taggedQuestions['uncategorized'].push(question);
      }
    });

    setQuestionsByTag(taggedQuestions);
  }, [questions, tags]);

  // 处理展开/折叠标签 - 使用 useCallback 优化
  const handleToggleExpand = useCallback(
    tagLabel => {
      // 检查是否需要加载此标签的问题数据
      const shouldExpand = !expandedTags[tagLabel];

      if (shouldExpand && !loadedTags[tagLabel]) {
        // 如果要展开且尚未加载数据，则加载数据
        fetchTagQuestions(tagLabel);
      }

      setExpandedTags(prev => ({
        ...prev,
        [tagLabel]: shouldExpand
      }));
    },
    [expandedTags, loadedTags, projectId]
  );

  // 获取特定标签的问题数据
  const fetchTagQuestions = useCallback(
    async tagLabel => {
      try {
        const response = await axios.get(
          `/api/projects/${projectId}/questions/tree?tag=${encodeURIComponent(tagLabel)}${searchTerm ? `&input=${searchTerm}` : ''}`
        );

        // 更新问题数据，合并新获取的数据
        setQuestions(prev => {
          // 创建一个新数组，包含现有数据
          const updatedQuestions = [...prev];

          // 添加新获取的问题数据
          response.data.forEach(newQuestion => {
            // 检查是否已存在相同 ID 的问题
            const existingIndex = updatedQuestions.findIndex(q => q.id === newQuestion.id);
            if (existingIndex === -1) {
              // 如果不存在，添加到数组
              updatedQuestions.push(newQuestion);
            } else {
              // 如果已存在，更新数据
              updatedQuestions[existingIndex] = newQuestion;
            }
          });

          return updatedQuestions;
        });

        // 标记该标签已加载数据
        setLoadedTags(prev => ({
          ...prev,
          [tagLabel]: true
        }));
      } catch (error) {
        console.error(`获取标签 "${tagLabel}" 的问题失败:`, error);
      }
    },
    [projectId, searchTerm, expandedTags]
  );

  // 检查问题是否被选中 - 使用 useCallback 优化
  const isQuestionSelected = useCallback(
    questionKey => {
      return selectedQuestions.includes(questionKey);
    },
    [selectedQuestions]
  );

  // 处理生成数据集 - 使用 useCallback 优化
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
  };

  // 渲染单个问题项 - 使用 useCallback 优化
  const renderQuestionItem = useCallback(
    (question, index, total) => {
      const questionKey = question.id;
      return (
        <QuestionItem
          key={questionKey}
          question={question}
          index={index}
          total={total}
          isSelected={isQuestionSelected(questionKey)}
          onSelect={onSelectQuestion}
          onDelete={onDeleteQuestion}
          onGenerate={handleGenerateDataset}
          onEdit={onEditQuestion}
          isProcessing={processingQuestions[questionKey]}
          t={t}
        />
      );
    },
    [isQuestionSelected, onSelectQuestion, onDeleteQuestion, handleGenerateDataset, processingQuestions, t]
  );

  // 计算标签及其子标签下的所有问题数量 - 使用 useMemo 缓存计算结果
  const tagQuestionCounts = useMemo(() => {
    const counts = {};

    const countQuestions = tag => {
      const directQuestions = questionsByTag[tag.label] || [];
      let total = directQuestions.length;

      if (tag.child && tag.child.length > 0) {
        for (const childTag of tag.child) {
          total += countQuestions(childTag);
        }
      }

      counts[tag.label] = total;
      return total;
    };

    tags.forEach(countQuestions);
    return counts;
  }, [questionsByTag, tags]);

  // 递归渲染标签树 - 使用 useCallback 优化
  const renderTagTree = useCallback(
    (tag, level = 0) => {
      const questions = questionsByTag[tag.label] || [];
      const hasQuestions = questions.length > 0;
      const hasChildren = tag.child && tag.child.length > 0;
      const isExpanded = expandedTags[tag.label];
      const totalQuestions = tagQuestionCounts[tag.label] || 0;

      return (
        <Box key={tag.label}>
          <TagItem
            tag={tag}
            level={level}
            isExpanded={isExpanded}
            totalQuestions={totalQuestions}
            onToggle={handleToggleExpand}
            t={t}
          />

          {/* 只有当标签展开时才渲染子内容，减少不必要的渲染 */}
          {isExpanded && (
            <Collapse in={true}>
              {hasChildren && (
                <List disablePadding>{tag.child.map(childTag => renderTagTree(childTag, level + 1))}</List>
              )}

              {hasQuestions && (
                <List disablePadding sx={{ mt: hasChildren ? 1 : 0 }}>
                  {questions.map((question, index) => renderQuestionItem(question, index, questions.length))}
                </List>
              )}
            </Collapse>
          )}
        </Box>
      );
    },
    [questionsByTag, expandedTags, tagQuestionCounts, handleToggleExpand, renderQuestionItem, t]
  );

  // 渲染未分类问题
  const renderUncategorizedQuestions = () => {
    const uncategorizedQuestions = questionsByTag['uncategorized'] || [];
    if (uncategorizedQuestions.length === 0) return null;

    return (
      <Box>
        <Box
          onClick={() => handleToggleExpand('uncategorized')}
          sx={theme => ({
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            mr: 1,
            mb: 1,
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            // 使用橙色/琥珀色系区分未分类项
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.18) 0%, rgba(245, 158, 11, 0.16) 100%)'
              : 'linear-gradient(135deg, rgba(251, 191, 36, 0.10) 0%, rgba(251, 146, 60, 0.08) 100%)',
            border: theme.palette.mode === 'dark'
              ? '1.5px solid rgba(251, 146, 60, 0.35)'
              : '1.5px solid rgba(251, 191, 36, 0.3)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(251, 146, 60, 0.2)'
              : '0 8px 24px rgba(251, 191, 36, 0.18)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.25) 0%, rgba(245, 158, 11, 0.22) 100%)'
                : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 146, 60, 0.12) 100%)',
              transform: 'translateY(-2px) translateX(2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 32px rgba(251, 146, 60, 0.3)'
                : '0 12px 32px rgba(251, 191, 36, 0.25)'
            },
            '&:active': {
              transform: 'translateY(-1px) translateX(1px)'
            }
          })}
        >
          {/* 图标 */}
          <Box
            sx={theme => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '12px',
              background: theme.palette.mode === 'dark'
                ? 'rgba(251, 146, 60, 0.15)'
                : 'rgba(251, 191, 36, 0.1)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(251, 146, 60, 0.3)'
                : '1px solid rgba(251, 191, 36, 0.25)',
              color: theme.palette.mode === 'dark' ? '#FCD34D' : '#F59E0B',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(251, 146, 60, 0.25)'
                : '0 4px 12px rgba(251, 191, 36, 0.2)',
              transition: 'all 0.2s ease'
            })}
          >
            <FolderIcon fontSize="small" />
          </Box>
          
          {/* 标签文字 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={theme => ({
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '-0.01em',
                color: theme.palette.mode === 'dark' ? '#FEF3C7' : '#D97706',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              })}
            >
              {t('datasets.uncategorized')}
            </Typography>
          </Box>
          
          {/* 问题数量徽章 */}
          <Chip
            label={t('datasets.questionCount', { count: uncategorizedQuestions.length })}
            size="small"
            sx={theme => ({
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '8px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)'
                : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%)',
              color: theme.palette.mode === 'dark' ? '#FDE68A' : '#D97706',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(251, 146, 60, 0.3)'
                : '1px solid rgba(251, 191, 36, 0.3)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 8px rgba(251, 146, 60, 0.2)'
                : '0 2px 8px rgba(251, 191, 36, 0.15)'
            })}
          />
          
          {/* 展开/收起图标 */}
          <IconButton
            size="small"
            sx={theme => ({
              width: 32,
              height: 32,
              borderRadius: '10px',
              color: theme.palette.mode === 'dark' ? '#FCD34D' : '#F59E0B',
              background: theme.palette.mode === 'dark'
                ? 'rgba(251, 146, 60, 0.12)'
                : 'rgba(251, 191, 36, 0.08)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(251, 146, 60, 0.25)'
                : '1px solid rgba(251, 191, 36, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'rgba(251, 146, 60, 0.2)'
                  : 'rgba(251, 191, 36, 0.15)',
                transform: 'scale(1.1)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(251, 146, 60, 0.3)'
                  : '0 4px 12px rgba(251, 191, 36, 0.25)'
              }
            })}
          >
            {expandedTags['uncategorized'] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expandedTags['uncategorized']}>
          <List disablePadding>
            {uncategorizedQuestions.map((question, index) =>
              renderQuestionItem(question, index, uncategorizedQuestions.length)
            )}
          </List>
        </Collapse>
      </Box>
    );
  };

  // 如果没有标签和问题，显示空状态
  if (tags.length === 0 && Object.keys(questionsByTag).length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('datasets.noTagsAndQuestions')}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.12)}`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 18px 45px -24px rgba(99,102,241,0.45)'
            : '0 24px 48px -32px rgba(15,23,42,0.18)',
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top, rgba(99,102,241,0.16) 0%, rgba(15,23,42,0.92) 42%)'
            : 'linear-gradient(180deg, rgba(248,250,255,0.92) 0%, rgba(255,255,255,0.88) 65%)',
        maxHeight: '76vh',
        display: 'flex',
        flexDirection: 'column'
      })}
    >
      <Box
        sx={theme => ({
          position: 'relative',
          px: 3,
          pt: 2.5,
          pb: 2,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(30,41,59,0.85) 55%)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(255,255,255,0.94) 65%)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.12)}`,
          zIndex: 1
        })}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              {t('questions.treeView.title', { defaultValue: '领域树视图' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('questions.treeView.subtitle', {
                defaultValue: '浏览标签层级，快速定位并操作相关问题'
              })}
            </Typography>
          </Box>
          <Chip
            label={t('questions.treeView.totalTags', {
              defaultValue: `${tags.length} 个分类`,
              count: tags.length
            })}
            size="small"
            sx={theme => ({
              alignSelf: 'flex-start',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: theme.palette.mode === 'dark' ? '#E0E7FF' : theme.palette.primary.main,
              borderRadius: 1,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.1),
              borderColor: alpha(theme.palette.primary.main, 0.2)
            })}
            variant="outlined"
          />
        </Stack>
      </Box>

      <Box
        sx={theme => ({
          position: 'relative',
          flex: 1,
          overflow: 'auto',
          p: 2.5,
          '&::-webkit-scrollbar': {
            width: 8
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.24),
            borderRadius: 999
          }
        })}
      >
        <List disablePadding sx={{ position: 'relative' }}>
          {renderUncategorizedQuestions()}
          {tags.map(tag => renderTagTree(tag))}
        </List>
      </Box>
    </Paper>
  );
}

// 使用 memo 优化问题项渲染
const QuestionItem = memo(
  ({ question, index, total, isSelected, onSelect, onDelete, onGenerate, onEdit, isProcessing, t }) => {
    const questionKey = question.id;
    return (
      <Box key={question.id}>
        <Box
          sx={theme => ({
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            px: 2,
            py: 1.5,
            ml: 2.5,
            mr: 1.5,
            mb: 1,
            borderRadius: '12px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            // 选中状态：使用青色系
            border: isSelected
              ? (theme.palette.mode === 'dark'
                ? '1.5px solid rgba(6, 182, 212, 0.5)'
                : '1.5px solid rgba(20, 184, 166, 0.4)')
              : (theme.palette.mode === 'dark'
                ? '1px solid rgba(100, 116, 139, 0.2)'
                : '1px solid rgba(226, 232, 240, 0.8)'),
            background: isSelected
              ? (theme.palette.mode === 'dark'
                ? 'rgba(6, 182, 212, 0.12)'
                : 'rgba(240, 253, 250, 1)') // teal-50
              : (theme.palette.mode === 'dark'
                ? 'rgba(51, 65, 85, 0.4)'
                : '#FFFFFF'),
            boxShadow: isSelected
              ? (theme.palette.mode === 'dark'
                ? '0 8px 20px rgba(6, 182, 212, 0.25)'
                : '0 8px 20px rgba(20, 184, 166, 0.18)')
              : (theme.palette.mode === 'dark'
                ? 'none'
                : '0 2px 6px rgba(0, 0, 0, 0.04)'),
            '&:hover': {
              transform: 'translateY(-2px)',
              background: isSelected
                ? (theme.palette.mode === 'dark'
                  ? 'rgba(6, 182, 212, 0.18)'
                  : 'rgba(204, 251, 241, 1)') // teal-100
                : (theme.palette.mode === 'dark'
                  ? 'rgba(71, 85, 105, 0.4)'
                  : 'rgba(248, 250, 252, 1)'), // slate-50
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 28px rgba(6, 182, 212, 0.3)'
                : '0 12px 28px rgba(20, 184, 166, 0.22)'
            },
            // 左侧选中指示条
            '&::before': isSelected ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '20%',
              width: '3px',
              borderRadius: '0 2px 2px 0',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(6, 182, 212, 0.8) 0%, rgba(6, 182, 212, 0.4) 100%)'
                : 'linear-gradient(180deg, rgba(20, 184, 166, 0.8) 0%, rgba(20, 184, 166, 0.4) 100%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 0 12px rgba(6, 182, 212, 0.5)'
                : '0 0 8px rgba(20, 184, 166, 0.4)'
            } : {}
          })}
        >
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect(questionKey)}
            size="small"
            sx={theme => ({
              mt: 0.5,
              color: theme.palette.mode === 'dark'
                ? 'rgba(148, 163, 184, 0.5)'
                : 'rgba(148, 163, 184, 0.6)',
              '&.Mui-checked': {
                color: theme.palette.mode === 'dark' ? '#22D3EE' : '#14B8A6'
              }
            })}
          />
          
          {/* 问题图标 */}
          <Box
            sx={theme => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              mt: 0.5,
              borderRadius: '10px',
              background: theme.palette.mode === 'dark'
                ? 'rgba(6, 182, 212, 0.12)'
                : 'rgba(20, 184, 166, 0.08)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(6, 182, 212, 0.25)'
                : '1px solid rgba(20, 184, 166, 0.2)',
              color: theme.palette.mode === 'dark' ? '#22D3EE' : '#14B8A6'
            })}
          >
            <QuestionMarkIcon fontSize="small" />
          </Box>
          
          {/* 问题内容 */}
          <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
            <Typography
              variant="body2"
              sx={theme => ({
                fontWeight: 500,
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                color: theme.palette.mode === 'dark' ? '#E2E8F0' : '#334155',
                mb: 0.75,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              })}
            >
              {question.question}
              {question.dataSites && question.dataSites.length > 0 && (
                <Chip
                  label={t('datasets.answerCount', { count: question.dataSites.length })}
                  size="small"
                  sx={theme => ({
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(6, 182, 212, 0.15)'
                      : 'rgba(20, 184, 166, 0.1)',
                    color: theme.palette.mode === 'dark' ? '#67E8F9' : '#0F766E',
                    border: theme.palette.mode === 'dark'
                      ? '1px solid rgba(6, 182, 212, 0.3)'
                      : '1px solid rgba(20, 184, 166, 0.25)'
                  })}
                />
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={theme => ({
                display: 'block',
                color: theme.palette.mode === 'dark'
                  ? 'rgba(148, 163, 184, 0.8)'
                  : 'rgba(100, 116, 139, 0.8)',
                fontSize: '0.8125rem'
              })}
            >
              {t('datasets.source')}: {question.chunk?.name || question.chunkId || t('common.unknown')}
            </Typography>
          </Box>
          
          {/* 操作按钮组 */}
          <Stack direction="row" spacing={0.5} sx={{ pt: 0.5 }}>
            <Tooltip title={t('common.edit')}>
              <IconButton
                size="small"
                onClick={() =>
                  onEdit({
                    question: question.question,
                    chunkId: question.chunkId,
                    label: question.label || 'other'
                  })
                }
                disabled={isProcessing}
                sx={theme => ({
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(148, 163, 184, 0.7)'
                    : 'rgba(100, 116, 139, 0.7)',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(71, 85, 105, 0.3)'
                    : 'rgba(248, 250, 252, 1)',
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(100, 116, 139, 0.2)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  transition: 'all 0.2s ease',
                  '&:hover:not(:disabled)': {
                    color: theme.palette.mode === 'dark' ? '#60A5FA' : '#3B82F6',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(59, 130, 246, 0.08)',
                    transform: 'scale(1.08)'
                  }
                })}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('datasets.generateDataset')}>
              <IconButton
                size="small"
                onClick={() => onGenerate(question.id, question.question)}
                disabled={isProcessing}
                sx={theme => ({
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(148, 163, 184, 0.7)'
                    : 'rgba(100, 116, 139, 0.7)',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(71, 85, 105, 0.3)'
                    : 'rgba(248, 250, 252, 1)',
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(100, 116, 139, 0.2)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  transition: 'all 0.2s ease',
                  '&:hover:not(:disabled)': {
                    color: theme.palette.mode === 'dark' ? '#A78BFA' : '#8B5CF6',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'rgba(139, 92, 246, 0.08)',
                    transform: 'scale(1.08)'
                  }
                })}
              >
                {isProcessing ? <CircularProgress size={16} /> : <AutoFixHighIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton
                size="small"
                onClick={() => onDelete(question.question, question.chunkId)}
                sx={theme => ({
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(148, 163, 184, 0.7)'
                    : 'rgba(100, 116, 139, 0.7)',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(71, 85, 105, 0.3)'
                    : 'rgba(248, 250, 252, 1)',
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(100, 116, 139, 0.2)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: theme.palette.mode === 'dark' ? '#F87171' : '#EF4444',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(239, 68, 68, 0.08)',
                    transform: 'scale(1.08)'
                  }
                })}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        {index < total - 1 && (
          <Divider
            sx={theme => ({
              ml: 4,
              mr: 2,
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(71, 85, 105, 0.3)'
                : 'rgba(226, 232, 240, 0.6)'
            })}
          />
        )}
      </Box>
    );
  }
);

// 使用 memo 优化标签项渲染
const TagItem = memo(({ tag, level, isExpanded, totalQuestions, onToggle, t }) => {
  // 专业级别的配色方案 - 避免使用深蓝色，确保在所有模式下都清晰可见
  const isDark = (theme) => theme.palette.mode === 'dark';
  
  // 一级标签（level === 0）配色
  const level0Colors = {
    // Dark 模式：使用青色/紫色渐变，避免深蓝色
    darkBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.20) 0%, rgba(139, 92, 246, 0.18) 100%)',
    darkBgHover: 'linear-gradient(135deg, rgba(6, 182, 212, 0.28) 0%, rgba(139, 92, 246, 0.25) 100%)',
    darkText: '#ECFEFF', // 青色浅色调
    darkBorder: 'rgba(6, 182, 212, 0.4)',
    darkShadow: '0 8px 24px rgba(6, 182, 212, 0.25)',
    // Light 模式：使用紫色/粉色渐变
    lightBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.10) 100%)',
    lightBgHover: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.15) 100%)',
    lightText: '#7C3AED', // 紫色
    lightBorder: 'rgba(168, 85, 247, 0.3)',
    lightShadow: '0 8px 24px rgba(168, 85, 247, 0.2)'
  };
  
  // 子节点（level > 0）配色
  const nestedColors = {
    // Dark 模式：使用更浅的青色
    darkBg: 'rgba(20, 184, 166, 0.10)',
    darkBgHover: 'rgba(20, 184, 166, 0.16)',
    darkText: '#99F6E4', // teal-200
    darkBorder: 'rgba(20, 184, 166, 0.25)',
    // Light 模式：使用白色/浅灰
    lightBg: '#FFFFFF',
    lightBgHover: 'rgba(245, 243, 255, 1)', // purple-50
    lightText: '#6B21A8', // purple-800
    lightBorder: 'rgba(233, 213, 255, 0.6)' // purple-200
  };
  
  return (
    <Box
      onClick={() => onToggle(tag.label)}
      sx={theme => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        ml: level > 0 ? level * 3 : 0,
        mr: 1,
        mb: 1,
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // 背景
        background: level === 0
          ? (isDark(theme) ? level0Colors.darkBg : level0Colors.lightBg)
          : (isDark(theme) ? nestedColors.darkBg : nestedColors.lightBg),
        // 边框
        border: level === 0
          ? `1.5px solid ${isDark(theme) ? level0Colors.darkBorder : level0Colors.lightBorder}`
          : `1px solid ${isDark(theme) ? nestedColors.darkBorder : nestedColors.lightBorder}`,
        // 阴影
        boxShadow: level === 0
          ? (isDark(theme) ? level0Colors.darkShadow : level0Colors.lightShadow)
          : (isDark(theme) ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)'),
        // Hover 效果
        '&:hover': {
          background: level === 0
            ? (isDark(theme) ? level0Colors.darkBgHover : level0Colors.lightBgHover)
            : (isDark(theme) ? nestedColors.darkBgHover : nestedColors.lightBgHover),
          transform: 'translateY(-2px) translateX(2px)',
          boxShadow: level === 0
            ? (isDark(theme)
              ? '0 12px 32px rgba(6, 182, 212, 0.35)'
              : '0 12px 32px rgba(168, 85, 247, 0.25)')
            : (isDark(theme)
              ? '0 4px 16px rgba(20, 184, 166, 0.2)'
              : '0 4px 16px rgba(168, 85, 247, 0.12)')
        },
        '&:active': {
          transform: 'translateY(-1px) translateX(1px)'
        },
        // 左侧指示线（仅子节点）
        '&::before': level > 0 ? {
          content: '""',
          position: 'absolute',
          left: -1,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '70%',
          borderRadius: '0 2px 2px 0',
          background: isDark(theme)
            ? 'linear-gradient(180deg, rgba(20, 184, 166, 0.6) 0%, rgba(20, 184, 166, 0.3) 100%)'
            : 'linear-gradient(180deg, rgba(168, 85, 247, 0.5) 0%, rgba(168, 85, 247, 0.2) 100%)',
          boxShadow: isDark(theme)
            ? '0 0 12px rgba(20, 184, 166, 0.4)'
            : '0 0 8px rgba(168, 85, 247, 0.3)'
        } : {}
      })}
    >
      {/* 图标 */}
      <Box
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '12px',
          background: level === 0
            ? (isDark(theme)
              ? 'rgba(6, 182, 212, 0.15)'
              : 'rgba(168, 85, 247, 0.1)')
            : (isDark(theme)
              ? 'rgba(20, 184, 166, 0.12)'
              : 'rgba(168, 85, 247, 0.08)'),
          border: level === 0
            ? `1px solid ${isDark(theme) ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.25)'}`
            : `1px solid ${isDark(theme) ? 'rgba(20, 184, 166, 0.2)' : 'rgba(233, 213, 255, 0.8)'}`,
          color: level === 0
            ? (isDark(theme) ? '#22D3EE' : '#A855F7')
            : (isDark(theme) ? '#5EEAD4' : '#9333EA'),
          boxShadow: level === 0
            ? (isDark(theme)
              ? '0 4px 12px rgba(6, 182, 212, 0.25)'
              : '0 4px 12px rgba(168, 85, 247, 0.2)')
            : 'none',
          transition: 'all 0.2s ease'
        })}
      >
        <FolderIcon fontSize="small" />
      </Box>
      
      {/* 标签文字 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={theme => ({
            fontWeight: level === 0 ? 700 : 600,
            fontSize: level === 0 ? '1rem' : '0.9375rem',
            letterSpacing: level === 0 ? '-0.01em' : '0',
            color: level === 0
              ? (isDark(theme) ? level0Colors.darkText : level0Colors.lightText)
              : (isDark(theme) ? nestedColors.darkText : nestedColors.lightText),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          })}
        >
          {tag.label}
        </Typography>
      </Box>
      
      {/* 问题数量徽章 */}
      {totalQuestions > 0 && (
        <Chip
          label={t('datasets.questionCount', { count: totalQuestions })}
          size="small"
          sx={theme => ({
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '8px',
            background: level === 0
              ? (isDark(theme)
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)'
                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)')
              : (isDark(theme)
                ? 'rgba(20, 184, 166, 0.15)'
                : 'rgba(168, 85, 247, 0.1)'),
            color: level === 0
              ? (isDark(theme) ? '#A5F3FC' : '#7C3AED')
              : (isDark(theme) ? '#5EEAD4' : '#9333EA'),
            border: `1px solid ${level === 0
              ? (isDark(theme) ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)')
              : (isDark(theme) ? 'rgba(20, 184, 166, 0.25)' : 'rgba(233, 213, 255, 0.8)')}`,
            boxShadow: level === 0
              ? (isDark(theme)
                ? '0 2px 8px rgba(6, 182, 212, 0.2)'
                : '0 2px 8px rgba(168, 85, 247, 0.15)')
              : 'none'
          })}
        />
      )}
      
      {/* 展开/收起图标 */}
      <IconButton
        size="small"
        sx={theme => ({
          width: 32,
          height: 32,
          borderRadius: '10px',
          color: level === 0
            ? (isDark(theme) ? '#67E8F9' : '#A855F7')
            : (isDark(theme) ? '#5EEAD4' : '#9333EA'),
          background: level === 0
            ? (isDark(theme)
              ? 'rgba(6, 182, 212, 0.12)'
              : 'rgba(168, 85, 247, 0.08)')
            : (isDark(theme)
              ? 'rgba(20, 184, 166, 0.1)'
              : 'rgba(168, 85, 247, 0.06)'),
          border: `1px solid ${level === 0
            ? (isDark(theme) ? 'rgba(6, 182, 212, 0.25)' : 'rgba(168, 85, 247, 0.2)')
            : (isDark(theme) ? 'rgba(20, 184, 166, 0.2)' : 'rgba(233, 213, 255, 0.6)')}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            background: level === 0
              ? (isDark(theme)
                ? 'rgba(6, 182, 212, 0.2)'
                : 'rgba(168, 85, 247, 0.15)')
              : (isDark(theme)
                ? 'rgba(20, 184, 166, 0.18)'
                : 'rgba(168, 85, 247, 0.12)'),
            transform: 'scale(1.1)',
            boxShadow: level === 0
              ? (isDark(theme)
                ? '0 4px 12px rgba(6, 182, 212, 0.3)'
                : '0 4px 12px rgba(168, 85, 247, 0.25)')
              : (isDark(theme)
                ? '0 2px 8px rgba(20, 184, 166, 0.25)'
                : '0 2px 8px rgba(168, 85, 247, 0.2)')
          }
        })}
      >
        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>
    </Box>
  );
});
