'use client';

import { Box, Select, MenuItem, Typography, FormControl, InputLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function PdfSettings({ pdfStrategy, setPdfStrategy, selectedViosnModel, setSelectedViosnModel }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="pdf-strategy-label">{t('textSplit.pdfStrategy')}</InputLabel>
        <Select
          labelId="pdf-strategy-label"
          value={pdfStrategy}
          onChange={e => setPdfStrategy(e.target.value)}
          label={t('textSplit.pdfStrategy')}
          size="small"
        >
          <MenuItem value="default">{t('textSplit.defaultStrategy')}</MenuItem>
          <MenuItem value="vision">{t('textSplit.visionStrategy')}</MenuItem>
        </Select>
      </FormControl>

      {pdfStrategy === 'vision' && (
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="vision-model-label">{t('textSplit.visionModel')}</InputLabel>
          <Select
            labelId="vision-model-label"
            value={selectedViosnModel}
            onChange={e => setSelectedViosnModel(e.target.value)}
            label={t('textSplit.visionModel')}
            size="small"
          >
            <MenuItem value="gpt-4-vision-preview">GPT-4 Vision</MenuItem>
            <MenuItem value="claude-3-opus">Claude-3 Opus</MenuItem>
            <MenuItem value="claude-3-sonnet">Claude-3 Sonnet</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
