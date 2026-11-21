'use client';

import { Box, Button, MenuItem, TextField } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ActionBar = ({ onBatchEvaluate, onImport, onExport, batchEvaluating = false }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('unscored');

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <TextField select size="small" label={t('datasets.evaluationScope', '评估范围')} value={mode}
        onChange={event => setMode(event.target.value)} disabled={batchEvaluating}>
        <MenuItem value="unscored">{t('datasets.evaluateUnscored', '仅评估未评估数据')}</MenuItem>
        <MenuItem value="selected">{t('datasets.reevaluateSelected', '重新评估选中数据')}</MenuItem>
        <MenuItem value="all">{t('datasets.reevaluateAll', '重新评估当前项目全部数据')}</MenuItem>
      </TextField>
      <Button
        variant="outlined"
        startIcon={<AssessmentIcon />}
        sx={{ borderRadius: 2 }}
        onClick={() => onBatchEvaluate(mode)}
        disabled={batchEvaluating}
      >
        {batchEvaluating ? t('datasets.evaluating', '评估中...') : t('datasets.batchEvaluate', '批量评估')}
      </Button>
      <Button variant="outlined" startIcon={<FileUploadIcon />} sx={{ borderRadius: 2 }} onClick={onImport}>
        {t('import.title', '导入')}
      </Button>
      <Button variant="outlined" startIcon={<FileDownloadIcon />} sx={{ borderRadius: 2 }} onClick={onExport}>
        {t('export.title')}
      </Button>
    </Box>
  );
};

export default ActionBar;
