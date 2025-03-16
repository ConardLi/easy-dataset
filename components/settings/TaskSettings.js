'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Slider,
  InputAdornment,
  Alert,
  Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import SaveIcon from '@mui/icons-material/Save';
import useTaskSettings from '@/hooks/useTaskSettings';

export default function TaskSettings({ projectId }) {
  const { t } = useTranslation();
  const { taskSettings, setTaskSettings, loading, error, success, setSuccess } =
    useTaskSettings(projectId);
  // 处理设置变更
  const handleSettingChange = e => {
    const { name, value } = e.target;
    setTaskSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理滑块变更
  const handleSliderChange = name => (event, newValue) => {
    setTaskSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // 保存任务配置
  const handleSaveTaskSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskSettings)
      });

      if (!response.ok) {
        throw new Error(t('settings.saveTasksFailed'));
      }

      setSuccess(true);
    } catch (error) {
      console.error('保存任务配置出错:', error);
      setError(error.message);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  if (loading) {
    return <Typography>{t('common.loading')}</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('settings.taskConfig')}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t('settings.textSplitSettings')}
            </Typography>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography id="text-split-min-length-slider" gutterBottom>
                {t('settings.minLength')}: {taskSettings.textSplitMinLength}
              </Typography>
              <Slider
                value={taskSettings.textSplitMinLength}
                onChange={handleSliderChange('textSplitMinLength')}
                aria-labelledby="text-split-min-length-slider"
                valueLabelDisplay="auto"
                step={100}
                marks
                min={500}
                max={3000}
              />

              <Typography id="text-split-max-length-slider" gutterBottom sx={{ mt: 3 }}>
                {t('settings.maxLength')}: {taskSettings.textSplitMaxLength}
              </Typography>
              <Slider
                value={taskSettings.textSplitMaxLength}
                onChange={handleSliderChange('textSplitMaxLength')}
                aria-labelledby="text-split-max-length-slider"
                valueLabelDisplay="auto"
                step={100}
                marks
                min={1000}
                max={5000}
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('settings.textSplitDescription')}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t('settings.questionGenSettings')}
            </Typography>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography id="question-generation-length-slider" gutterBottom>
                {t('settings.questionGenLength', { length: taskSettings.questionGenerationLength })}
              </Typography>
              <Slider
                value={taskSettings.questionGenerationLength}
                onChange={handleSliderChange('questionGenerationLength')}
                aria-labelledby="question-generation-length-slider"
                valueLabelDisplay="auto"
                step={20}
                marks
                min={100}
                max={500}
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('settings.questionGenDescription')}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t('settings.huggingfaceSettings')}
            </Typography>
            <TextField
              fullWidth
              label={t('settings.huggingfaceToken')}
              name="huggingfaceToken"
              value={taskSettings.huggingfaceToken}
              onChange={handleSettingChange}
              type="password"
              helperText={t('settings.huggingfaceNotImplemented')}
              InputProps={{
                startAdornment: <InputAdornment position="start">hf_</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t('settings.concurrencyLimit')}
            </Typography>
            <TextField
              fullWidth
              label={t('settings.concurrencyLimit')}
              name="concurrencyLimit"
              value={taskSettings.concurrencyLimit}
              onChange={handleSettingChange}
              type="number"
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveTaskSettings}>
              {t('settings.saveTaskConfig')}
            </Button>
          </Grid>
        </Grid>
      </CardContent>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {t('settings.saveSuccess')}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
}
