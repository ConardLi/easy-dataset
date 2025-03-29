'use client';

import React from 'react';
import { Grid, Button, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import ModelSelector from './ModelSelector';
import { playgroundStyles } from '@/styles/playground';
import { useTranslation } from 'react-i18next';

const PlaygroundHeader = ({
  availableModels,
  selectedModels,
  handleModelSelection,
  handleClearConversations,
  conversations,
  outputMode,
  handleOutputModeChange
}) => {
  const theme = useTheme();
  const styles = playgroundStyles(theme);
  const { t } = useTranslation();

  const isClearDisabled = selectedModels.length === 0 || Object.values(conversations).every(conv => conv.length === 0);

  return (
    <>
      <Grid container spacing={2} sx={styles.controlsContainer}>
        <Grid item xs={12} md={6}>
          <ModelSelector models={availableModels} selectedModels={selectedModels} onChange={handleModelSelection} />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel id="output-mode-label">{t('playground.outputMode')}</InputLabel>
            <Select
              labelId="output-mode-label"
              id="output-mode-select"
              value={outputMode}
              label={t('playground.outputMode')}
              onChange={handleOutputModeChange}
            >
              <MenuItem value="normal">{t('playground.normalOutput')}</MenuItem>
              <MenuItem value="streaming">{t('playground.streamingOutput')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearConversations}
            disabled={isClearDisabled}
            sx={styles.clearButton}
          >
            {t('playground.clearConversation')}
          </Button>
        </Grid>
      </Grid>

      <Divider sx={styles.divider} />
    </>
  );
};

export default PlaygroundHeader;
