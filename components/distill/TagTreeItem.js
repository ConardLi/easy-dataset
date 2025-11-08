'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
  List,
  CircularProgress
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from 'react-i18next';
import QuestionListItem from './QuestionListItem';
import { alpha, useTheme } from '@mui/material/styles';

/**
 * 标签树项组件
 * @param {Object} props
 * @param {Object} props.tag - 标签对象
 * @param {number} props.level - 缩进级别
 * @param {boolean} props.expanded - 是否展开
 * @param {Function} props.onToggle - 切换展开/折叠的回调
 * @param {Function} props.onMenuOpen - 打开菜单的回调
 * @param {Function} props.onGenerateQuestions - 生成问题的回调
 * @param {Function} props.onGenerateSubTags - 生成子标签的回调
 * @param {Array} props.questions - 标签下的问题列表
 * @param {boolean} props.loadingQuestions - 是否正在加载问题
 * @param {Object} props.processingQuestions - 正在处理的问题ID映射
 * @param {Function} props.onDeleteQuestion - 删除问题的回调
 * @param {Function} props.onGenerateDataset - 生成数据集的回调
 * @param {Function} props.onGenerateMultiTurnDataset - 生成多轮对话数据集的回调
 * @param {Object} props.processingMultiTurnQuestions - 正在生成多轮对话的问题ID映射
 * @param {Array} props.allQuestions - 所有问题列表（用于计算问题数量）
 * @param {Object} props.tagQuestions - 标签问题映射
 * @param {React.ReactNode} props.children - 子标签内容
 */
export default function TagTreeItem({
  tag,
  level = 0,
  expanded = false,
  onToggle,
  onMenuOpen,
  onGenerateQuestions,
  onGenerateSubTags,
  questions = [],
  loadingQuestions = false,
  processingQuestions = {},
  onDeleteQuestion,
  onGenerateDataset,
  onGenerateMultiTurnDataset,
  processingMultiTurnQuestions = {},
  allQuestions = [],
  tagQuestions = {},
  children
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const branchColor = alpha(theme.palette.primary.main, isDark ? 0.35 : 0.18);
  const nestedBackground = alpha(theme.palette.primary.main, isDark ? 0.1 : 0.04);
  const idleBackground = alpha(theme.palette.primary.main, isDark ? 0.14 : 0.06);
  const expandedBackground = alpha(theme.palette.primary.main, isDark ? 0.32 : 0.18);
  const hoverBackground = alpha(theme.palette.primary.main, isDark ? 0.42 : 0.24);
  const accentTextColor = isDark ? theme.palette.primary.light : theme.palette.primary.dark;
  const secondaryAccentTextColor = isDark ? theme.palette.secondary.light : theme.palette.secondary.dark;

  const actionButtonStyles = colorKey => ({
    backgroundColor: alpha(theme.palette[colorKey].main, isDark ? 0.26 : 0.12),
    color: isDark ? theme.palette[colorKey].light : theme.palette[colorKey].dark,
    '&:hover': {
      backgroundColor: alpha(theme.palette[colorKey].main, isDark ? 0.36 : 0.2)
    }
  });

  // 递归计算所有层级的子标签数量
  const getTotalSubTagsCount = childrenTags => {
    let count = childrenTags.length;
    childrenTags.forEach(childTag => {
      if (childTag.children && childTag.children.length > 0) {
        count += getTotalSubTagsCount(childTag.children);
      }
    });
    return count;
  };

  // 递归获取所有子标签的问题数量
  const getChildrenQuestionsCount = childrenTags => {
    let count = 0;
    childrenTags.forEach(childTag => {
      // 子标签的问题
      if (tagQuestions[childTag.id] && tagQuestions[childTag.id].length > 0) {
        count += tagQuestions[childTag.id].length;
      } else {
        count += allQuestions.filter(q => q.label === childTag.label).length;
      }

      // 子标签的子标签的问题
      if (childTag.children && childTag.children.length > 0) {
        count += getChildrenQuestionsCount(childTag.children);
      }
    });
    return count;
  };

  // 计算当前标签的问题数量
  const getCurrentTagQuestionsCount = () => {
    let currentTagQuestions = 0;
    if (tagQuestions[tag.id] && tagQuestions[tag.id].length > 0) {
      currentTagQuestions = tagQuestions[tag.id].length;
    } else {
      currentTagQuestions = allQuestions.filter(q => q.label === tag.label).length;
    }
    return currentTagQuestions;
  };

  // 总问题数量 = 当前标签的问题 + 所有子标签的问题
  const totalQuestions =
    getCurrentTagQuestionsCount() + (tag.children ? getChildrenQuestionsCount(tag.children || []) : 0);

  return (
    <Box key={tag.id} sx={{ my: 0.5 }}>
      <ListItem
        disablePadding
        sx={{
          pl: level * 2,
          borderLeft: level > 0 ? `1px solid ${branchColor}` : 'none',
          ml: level > 0 ? 1.75 : 0
        }}
      >
        <ListItemButton
          onClick={() => onToggle(tag.id)}
          sx={{
            borderRadius: 1.5,
            py: 0.9,
            px: 1.25,
            backgroundColor: expanded ? expandedBackground : idleBackground,
            color: expanded ? theme.palette.primary.contrastText : theme.palette.text.primary,
            transition: 'all 0.2s ease',
            boxShadow: expanded ? theme.shadows[isDark ? 3 : 2] : 'none',
            '&:hover': {
              backgroundColor: expanded ? hoverBackground : alpha(theme.palette.primary.main, isDark ? 0.24 : 0.12),
              transform: 'translateX(4px)',
              boxShadow: theme.shadows[isDark ? 3 : 4]
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 42 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.2,
                display: 'grid',
                placeItems: 'center',
                background: alpha(theme.palette.primary.main, isDark ? 0.24 : 0.1),
                boxShadow: `0 6px 14px ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.18)}`
              }}
            >
              <FolderIcon sx={{ fontSize: 18, color: accentTextColor }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: expanded ? theme.palette.primary.contrastText : theme.palette.text.primary,
                    transition: 'color 0.2s ease'
                  }}
                >
                  {tag.label}
                </Typography>
                {tag.children && tag.children.length > 0 && (
                  <Chip
                    size="small"
                    label={`${getTotalSubTagsCount(tag.children)} ${t('distill.subTags')}`}
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderColor: alpha(theme.palette.primary.main, isDark ? 0.45 : 0.3),
                      backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.20 : 0.08),
                      color: accentTextColor
                    }}
                  />
                )}
                {totalQuestions > 0 && (
                  <Chip
                    size="small"
                    label={`${totalQuestions} ${t('distill.questions')}`}
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderColor: alpha(theme.palette.secondary.main, isDark ? 0.42 : 0.32),
                      backgroundColor: alpha(theme.palette.secondary.main, isDark ? 0.22 : 0.08),
                      color: secondaryAccentTextColor
                    }}
                  />
                )}
              </Box>
            }
            primaryTypographyProps={{ component: 'div' }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={t('distill.generateQuestions')}>
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onGenerateQuestions(tag);
                }}
                sx={{
                  ...actionButtonStyles('secondary'),
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, isDark ? 0.3 : 0.2)}`
                }}
              >
                <QuestionMarkIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('distill.addChildTag')}>
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onGenerateSubTags(tag);
                }}
                sx={{
                  ...actionButtonStyles('primary'),
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, isDark ? 0.32 : 0.2)}`
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <IconButton
              size="small"
              onClick={e => onMenuOpen(e, tag)}
              sx={{
                backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.22 : 0.08),
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.32 : 0.16)
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            {tag.children && tag.children.length > 0 ? (
              expanded ? (
                <ExpandLessIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
              ) : (
                <ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
              )
            ) : null}
          </Box>
        </ListItemButton>
      </ListItem>

      {/* 子标签 */}
      {tag.children && tag.children.length > 0 && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {children}
        </Collapse>
      )}

      {/* 标签下的问题 */}
      {expanded && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List
            disablePadding
            sx={{
              mt: 0.5,
              mb: 1,
              borderRadius: 1.5,
              backgroundColor: nestedBackground,
              backdropFilter: 'blur(10px)'
            }}
          >
            {loadingQuestions ? (
              <ListItem sx={{ pl: (level + 1) * 2, py: 0.75 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {t('common.loading')}
                </Typography>
              </ListItem>
            ) : questions && questions.length > 0 ? (
              questions.map(question => (
                <QuestionListItem
                  key={question.id}
                  question={question}
                  level={level}
                  processing={processingQuestions[question.id]}
                  processingMultiTurn={processingMultiTurnQuestions[question.id]}
                  onDelete={e => onDeleteQuestion(question.id, e)}
                  onGenerateDataset={e => onGenerateDataset(question.id, question.question, e)}
                  onGenerateMultiTurnDataset={
                    onGenerateMultiTurnDataset ? e => onGenerateMultiTurnDataset(question.id, question, e) : undefined
                  }
                />
              ))
            ) : (
              <ListItem sx={{ pl: (level + 1) * 2, py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('distill.noQuestions')}
                </Typography>
              </ListItem>
            )}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
