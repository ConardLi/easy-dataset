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

export default function TaskFilters({ statusFilter, setStatusFilter, typeFilter, setTypeFilter, loading, onRefresh }) {
  const { t } = useTranslation();

  const taskTypeOptions = [
    'text-processing',
    'file-processing',
    'pdf-processing',
    'question-generation',
    'answer-generation',
    'data-cleaning',
    'data-distillation',
    'eval-generation',
    'multi-turn-generation',
    'image-question-generation'
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('tasks.filters.status')}</InputLabel>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} input={<OutlinedInput label={t('tasks.filters.status')} />}>
          <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
          <MenuItem value="0">{t('tasks.status.processing')}</MenuItem>
          <MenuItem value="1">{t('tasks.status.completed')}</MenuItem>
          <MenuItem value="2">{t('tasks.status.failed')}</MenuItem>
          <MenuItem value="3">{t('tasks.status.aborted')}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>{t('tasks.filters.type')}</InputLabel>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} input={<OutlinedInput label={t('tasks.filters.type')} />}>
          <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
          {taskTypeOptions.map(type => (
            <MenuItem key={type} value={type}>
              {t(`tasks.types.${type}`, { defaultValue: type })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tooltip title={t('tasks.actions.refresh')}>
        <IconButton onClick={onRefresh} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
