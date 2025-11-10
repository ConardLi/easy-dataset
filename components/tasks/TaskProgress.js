'use client';

import React from 'react';
import { Stack, LinearProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

// 任务进度组件
export default function TaskProgress({ task }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 如果没有总数，则不显示进度条
  if (task.totalCount === 0) return '-';

  // 计算进度百分比
  const progress = (task.completedCount / task.totalCount) * 100;

  return (
    <Stack direction="column" spacing={0.5}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          width: 160,
          backgroundColor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.5s ease',
            background: isDark
              ? theme.palette.gradient.primary
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: isDark
              ? '0 0 12px rgba(99, 102, 241, 0.35)'
              : '0 0 8px rgba(99, 102, 241, 0.2)'
          }
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {task.completedCount} / {task.totalCount} ({Math.round(progress)}%)
      </Typography>
    </Stack>
  );
}
