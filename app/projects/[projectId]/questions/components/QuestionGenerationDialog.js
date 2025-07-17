'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Collapse,
  TextField,
  Grid,
  Divider,
  Alert,
} from '@mui/material';

const PRESET_PROFILES = {
  deep_analysis: { local: 30, contextual: 45, global: 25 },
  rag: { local: 60, contextual: 30, global: 10 },
};

export default function QuestionGenerationDialog({ open, onClose, onSubmit, model }) {
  const { t } = useTranslation();
  const [strategy, setStrategy] = useState('smart-mix');
  const [loading, setLoading] = useState(false);

  // State for smart-mix strategy
  const [totalSize, setTotalSize] = useState(1000);
  const [proportions, setProportions] = useState(PRESET_PROFILES.deep_analysis);
  const [preset, setPreset] = useState('deep_analysis');
  const [proportionError, setProportionError] = useState('');

  useEffect(() => {
    const sum = Object.values(proportions).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      setProportionError(t('questions.proportionError', { sum }));
    } else {
      setProportionError('');
    }
  }, [proportions, t]);

  const handleStrategyChange = (event) => {
    setStrategy(event.target.value);
  };

  const handlePresetChange = (event) => {
    const newPreset = event.target.value;
    setPreset(newPreset);
    if (PRESET_PROFILES[newPreset]) {
      setProportions(PRESET_PROFILES[newPreset]);
    }
  };

  const handleProportionChange = (type) => (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setProportions(prev => ({ ...prev, [type]: value }));
      setPreset('custom');
    }
  };

  const handleSubmit = async () => {
    if (!model) {
      alert(t('questions.selectModelFirst'));
      return;
    }
    if (strategy === 'smart-mix' && proportionError) {
      alert(proportionError);
      return;
    }

    setLoading(true);
    try {
      const params = {
        strategy,
        ...(strategy === 'smart-mix' && { totalSize, proportions })
      };
      await onSubmit(params);
      onClose();
    } catch (error) {
      // Error handling is likely done in the parent component via toast
    } finally {
      setLoading(false);
    }
  };

  const strategyDescriptions = {
    'smart-mix': t('questions.strategySmartMixDesc'),
    local: t('questions.strategyLocalDesc'),
    contextual: t('questions.strategyContextualDesc'),
    global: t('questions.strategyGlobalDesc'),
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('questions.generateQuestionsTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="strategy-select-label">{t('questions.generationStrategy')}</InputLabel>
            <Select
              labelId="strategy-select-label"
              value={strategy}
              label={t('questions.generationStrategy')}
              onChange={handleStrategyChange}
            >
              <MenuItem value="smart-mix">{t('questions.strategySmartMix')}</MenuItem>
              <MenuItem value="local">{t('questions.strategyLocal')}</MenuItem>
              <MenuItem value="contextual">{t('questions.strategyContextual')}</MenuItem>
              <MenuItem value="global">{t('questions.strategyGlobal')}</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {strategyDescriptions[strategy]}
          </Typography>
        </Box>

        <Collapse in={strategy === 'smart-mix'}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="preset-select-label">{t('questions.presetTitle')}</InputLabel>
              <Select
                labelId="preset-select-label"
                value={preset}
                label={t('questions.presetTitle')}
                onChange={handlePresetChange}
              >
                <MenuItem value="deep_analysis">{t('questions.presetDeepAnalysis')}</MenuItem>
                <MenuItem value="rag">{t('questions.presetRAG')}</MenuItem>
                <MenuItem value="custom" disabled>{t('questions.presetCustom')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={t('questions.totalSize')}
              type="number"
              fullWidth
              value={totalSize}
              onChange={(e) => setTotalSize(parseInt(e.target.value, 10) || 0)}
              helperText={t('questions.totalSizeHelp')}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>{t('questions.proportionTitle')}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label={t('questions.proportionLocal')} type="number" value={proportions.local} onChange={handleProportionChange('local')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label={t('questions.proportionContextual')} type="number" value={proportions.contextual} onChange={handleProportionChange('contextual')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label={t('questions.proportionGlobal')} type="number" value={proportions.global} onChange={handleProportionChange('global')} />
              </Grid>
            </Grid>
            {proportionError && <Alert severity="error" sx={{mt: 1}}>{proportionError}</Alert>}
          </Box>
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !model || !!proportionError}>
          {loading ? t('common.generating') : t('common.start')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
