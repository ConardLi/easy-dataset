'use client';

import {
  Box,
  Typography,
  Checkbox,
  Button
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import { useTranslation } from 'react-i18next';

export default function ChunkListHeader({
  totalChunks,
  selectedChunks,
  onSelectAll,
  onBatchGenerateQuestions
}) {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Checkbox
          checked={selectedChunks.length === totalChunks}
          indeterminate={selectedChunks.length > 0 && selectedChunks.length < totalChunks}
          onChange={onSelectAll}
        />
        <Typography variant="body1">
          {t('textSplit.selectedCount', { count: selectedChunks.length })} ,{t('textSplit.totalCount',{ count: totalChunks})}
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        startIcon={<QuizIcon />}
        disabled={selectedChunks.length === 0}
        onClick={onBatchGenerateQuestions}
      >
        {t('textSplit.batchGenerateQuestions')}
      </Button>
    </Box>
  );
}