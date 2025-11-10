'use client';

import React from 'react';
import { Chip, CircularProgress, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

// 任务状态显示组件
export default function TaskStatusChip({ status }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 状态映射配置
  const STATUS_CONFIG = {
    0: {
      label: t('tasks.status.processing'),
      color: 'warning',
      loading: true
    },
    1: {
      label: t('tasks.status.completed'),
      color: 'success'
    },
    2: {
      label: t('tasks.status.failed'),
      color: 'error'
    },
    3: {
      label: t('tasks.status.aborted'),
      color: 'default'
    }
  };

  const statusInfo = STATUS_CONFIG[status] || {
    label: t('tasks.status.unknown'),
    color: 'default'
  };

  // 处理中状态显示加载动画
  if (status === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} color="warning" />
        <Chip
          label={statusInfo.label}
          size="small"
          color={statusInfo.color}
          sx={isDark ? {
            border: '1px solid rgba(245, 158, 11, 0.5)',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#FBBF24',
            boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.2), 0 0 12px rgba(245, 158, 11, 0.25)',
          } : undefined}
        />
      </Box>
    );
  }

  // 其他状态在暗色下自定义更高对比度与科技感
  const darkStylesByStatus = {
    1: {
      border: '1px solid rgba(34, 197, 94, 0.5)',
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      color: '#34D399',
      boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.2), 0 0 12px rgba(34, 197, 94, 0.25)'
    },
    2: {
      border: '1px solid rgba(239, 68, 68, 0.5)',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      color: '#F87171',
      boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.2), 0 0 12px rgba(239, 68, 68, 0.25)'
    },
    3: {
      border: '1px solid rgba(148, 163, 184, 0.4)',
      backgroundColor: 'rgba(148, 163, 184, 0.12)',
      color: theme.palette.text.secondary
    }
  };

  return (
    <Chip
      label={statusInfo.label}
      color={statusInfo.color}
      size="small"
      sx={isDark ? (darkStylesByStatus[status] || undefined) : undefined}
    />
  );
}
