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
 * @param {Object} props.labelCountMap - label -> 问题数量的映射（由 DistillTreeView 预建，O(1) 查找）
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
  labelCountMap = {},
  tagQuestions = {},
  children
}) {
  const { t } = useTranslation();

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

  // 递归获取所有子标签的问题数量（使用 labelCountMap，O(1) 查找）
  const getChildrenQuestionsCount = childrenTags => {
    let count = 0;
    childrenTags.forEach(childTag => {
      if (tagQuestions[childTag.id] && tagQuestions[childTag.id].length > 0) {
        count += tagQuestions[childTag.id].length;
      } else {
        count += labelCountMap[childTag.label] || 0;
      }
      if (childTag.children && childTag.children.length > 0) {
        count += getChildrenQuestionsCount(childTag.children);
      }
    });
    return count;
  };

  // 计算当前标签的问题数量（使用 labelCountMap，O(1) 查找）
  const getCurrentTagQuestionsCount = () => {
    if (tagQuestions[tag.id] && tagQuestions[tag.id].length > 0) {
      return tagQuestions[tag.id].length;
    }
    return labelCountMap[tag.label] || 0;
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
          borderLeft: level > 0 ? '1px dashed rgba(0, 0, 0, 0.1)' : 'none',
          ml: level > 0 ? 2 : 0
        }}
      >
        <ListItemButton onClick={() => onToggle(tag.id)} sx={{ borderRadius: 1, py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FolderIcon color="primary" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 'medium' }}>{tag.label}</Typography>
                {tag.children && tag.children.length > 0 && (
                  <Chip
                    size="small"
                    label={`${getTotalSubTagsCount(tag.children)} ${t('distill.subTags')}`}
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {totalQuestions > 0 && (
                  <Chip
                    size="small"
                    label={`${totalQuestions} ${t('distill.questions')}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
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
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <IconButton size="small" onClick={e => onMenuOpen(e, tag)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>

            {tag.children && tag.children.length > 0 ? (
              expanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
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
          <List disablePadding sx={{ mt: 0.5, mb: 1 }}>
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
