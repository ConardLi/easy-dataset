'use client';

import { Box, Button } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTranslation } from 'react-i18next';

const ActionBar = ({ onBatchEvaluate, onImport, onExport, batchEvaluating = false }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Button
        variant="outlined"
        startIcon={<AssessmentIcon />}
        sx={{ borderRadius: 2 }}
        onClick={onBatchEvaluate}
        disabled={batchEvaluating}
      >
        {batchEvaluating ? t('datasets.evaluating', '评估中...') : t('datasets.batchEvaluate', '批量评估')}
      </Button>
      <Button variant="outlined" startIcon={<FileDownloadIcon />} sx={{ borderRadius: 2 }} onClick={onImport}>
        {t('import.title', '导入')}
      </Button>
      <Button variant="outlined" startIcon={<FileUploadIcon />} sx={{ borderRadius: 2 }} onClick={onExport}>
        {t('export.title')}
      </Button>
    </Box>
  );
};

export default ActionBar;
