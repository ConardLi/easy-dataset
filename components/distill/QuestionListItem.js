'use client';

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ChatIcon from '@mui/icons-material/Chat';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';

/**
 * 问题列表项组件
 * @param {Object} props
 * @param {Object} props.question - 问题对象
 * @param {number} props.level - 缩进级别
 * @param {Function} props.onDelete - 删除问题的回调
 * @param {Function} props.onGenerateDataset - 生成数据集的回调
 * @param {Function} props.onGenerateMultiTurnDataset - 生成多轮对话数据集的回调
 * @param {boolean} props.processing - 是否正在处理
 * @param {boolean} props.processingMultiTurn - 是否正在生成多轮对话
 */
export default function QuestionListItem({
  question,
  level,
  onDelete,
  onGenerateDataset,
  onGenerateMultiTurnDataset,
  processing = false,
  processingMultiTurn = false
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const branchLineColor = alpha(theme.palette.secondary.main, isDark ? 0.4 : 0.18);
  const hoverBackground = alpha(theme.palette.secondary.main, isDark ? 0.26 : 0.1);
  const baseBackground = alpha(theme.palette.background.paper, isDark ? 0.22 : 0.08);
  const iconWrapperBg = alpha(theme.palette.secondary.main, isDark ? 0.28 : 0.14);
  const iconColor = isDark ? theme.palette.secondary.light : theme.palette.secondary.dark;

  return (
    <ListItem
      sx={{
        pl: (level + 1) * 2.2,
        py: 1,
        pr: 14,
        ml: 2,
        mt: 0.5,
        borderLeft: `1px solid ${branchLineColor}`,
        borderRadius: 1.5,
        backgroundColor: baseBackground,
        backdropFilter: 'blur(12px)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: hoverBackground,
          transform: 'translateX(6px)',
          boxShadow: theme.shadows[isDark ? 2 : 3]
        }
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={t('datasets.generateDataset')}>
            <IconButton
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.26 : 0.12),
                color: isDark ? theme.palette.primary.light : theme.palette.primary.dark,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.36 : 0.2)
                }
              }}
              onClick={e => onGenerateDataset(e)}
              disabled={processing || processingMultiTurn}
            >
              {processing ? <CircularProgress size={16} /> : <AutoFixHighIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('questions.generateMultiTurnDataset', { defaultValue: '生成多轮对话数据集' })}>
            <IconButton
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.secondary.main, isDark ? 0.26 : 0.12),
                color: isDark ? theme.palette.secondary.light : theme.palette.secondary.dark,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, isDark ? 0.36 : 0.2)
                }
              }}
              onClick={e => onGenerateMultiTurnDataset && onGenerateMultiTurnDataset(e)}
              disabled={processing || processingMultiTurn || !onGenerateMultiTurnDataset}
            >
              {processingMultiTurn ? <CircularProgress size={16} /> : <ChatIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.error.main, isDark ? 0.28 : 0.12),
                color: isDark ? theme.palette.error.light : theme.palette.error.dark,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, isDark ? 0.38 : 0.2)
                }
              }}
              onClick={e => onDelete(e)}
              disabled={processing || processingMultiTurn}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            backgroundColor: iconWrapperBg,
            boxShadow: `0 6px 14px ${alpha(theme.palette.secondary.main, isDark ? 0.35 : 0.2)}`
          }}
        >
          <HelpOutlineIcon fontSize="small" sx={{ color: iconColor }} />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                paddingRight: '28px' // 留出删除按钮的空间
              }}
            >
              {question.question}
            </Typography>
            {question.answered && (
              <Chip
                size="small"
                label={t('datasets.answered')}
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderColor: alpha(theme.palette.success.main, isDark ? 0.45 : 0.28),
                    backgroundColor: alpha(theme.palette.success.main, isDark ? 0.24 : 0.12),
                    color: isDark ? theme.palette.success.light : theme.palette.success.dark
                  }}
              />
            )}
          </Box>
        }
      />
    </ListItem>
  );
}
