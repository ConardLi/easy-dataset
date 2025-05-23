'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';

// 任务筛选组件
export default function TaskFilters({ statusFilter, setStatusFilter, typeFilter, setTypeFilter, loading, onRefresh }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* 状态筛选 */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('tasks.filters.status')}</InputLabel>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          input={<OutlinedInput label={t('tasks.filters.status')} />}
        >
          <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
          <MenuItem value="0">{t('tasks.status.processing')}</MenuItem>
          <MenuItem value="1">{t('tasks.status.completed')}</MenuItem>
          <MenuItem value="2">{t('tasks.status.failed')}</MenuItem>
          <MenuItem value="3">{t('tasks.status.aborted')}</MenuItem>
        </Select>
      </FormControl>

      {/* 类型筛选 */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('tasks.filters.type')}</InputLabel>
        <Select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          input={<OutlinedInput label={t('tasks.filters.type')} />}
        >
          <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
          <MenuItem value="text-processing">{t('tasks.types.text-processing')}</MenuItem>
          <MenuItem value="question-generation">{t('tasks.types.question-generation')}</MenuItem>
          <MenuItem value="answer-generation">{t('tasks.types.answer-generation')}</MenuItem>
          <MenuItem value="data-distillation">{t('tasks.types.data-distillation')}</MenuItem>
          <MenuItem value="pdf-processing">{t('tasks.types.pdf-processing')}</MenuItem>
        </Select>
      </FormControl>

      {/* 刷新按钮 */}
      <Tooltip title={t('tasks.actions.refresh')}>
        <IconButton onClick={onRefresh} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
