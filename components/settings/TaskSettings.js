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
  Snackbar,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  Chip,
  FormHelperText
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import SaveIcon from '@mui/icons-material/Save';
import useTaskSettings from '@/hooks/useTaskSettings';

export default function TaskSettings({ projectId }) {
  const { t } = useTranslation();
  const { taskSettings, setTaskSettings, loading, error, success, setSuccess } = useTaskSettings(projectId);
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
      // 确保数组类型的数据被正确处理
      const settingsToSave = { ...taskSettings };

      // 确保递归分块的分隔符数组存在
      if (settingsToSave.splitType === 'recursive' && settingsToSave.separatorsInput) {
        if (!settingsToSave.separators || !Array.isArray(settingsToSave.separators)) {
          settingsToSave.separators = settingsToSave.separatorsInput.split(',').map(item => item.trim());
        }
      }

      console.log('Saving settings:', settingsToSave);

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsToSave)
      });

      if (!response.ok) {
        throw new Error(t('settings.saveTasksFailed'));
      }

      setSuccess(true);
    } catch (error) {
      console.error('保存任务配置出错:', error);
      //setError(error.message);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    //setError(null);
  };

  if (loading) {
    return <Typography>{t('common.loading')}</Typography>;
  }

  return (
    <Box sx={{ position: 'relative', pb: 8 }}>
      {' '}
      {/* 添加底部填充，为固定按钮留出空间 */}
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                {t('settings.textSplitSettings')}
              </Typography>
              <Box sx={{ px: 2, py: 1 }}>
                {/* 分块策略选择 */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="split-type-label">{t('settings.splitType')}</InputLabel>
                  <Select
                    labelId="split-type-label"
                    value={taskSettings.splitType || 'markdown'}
                    label={t('settings.splitType')}
                    name="splitType"
                    onChange={handleSettingChange}
                  >
                    <MenuItem value="markdown">
                      <Box>
                        <Typography variant="subtitle2">{t('settings.splitTypeMarkdown')}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {t('settings.splitTypeMarkdownDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="recursive">
                      <Box>
                        <Typography variant="subtitle2">{t('settings.splitTypeRecursive')}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {t('settings.splitTypeRecursiveDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="text">
                      <Box>
                        <Typography variant="subtitle2">{t('settings.splitTypeText')}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {t('settings.splitTypeTextDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="token">
                      <Box>
                        <Typography variant="subtitle2">{t('settings.splitTypeToken')}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {t('settings.splitTypeTokenDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="code">
                      <Box>
                        <Typography variant="subtitle2">{t('settings.splitTypeCode')}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {t('settings.splitTypeCodeDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Markdown模式设置 */}
                {(!taskSettings.splitType || taskSettings.splitType === 'markdown') && (
                  <>
                    <Typography id="text-split-min-length-slider" gutterBottom>
                      {t('settings.minLength')}: {taskSettings.textSplitMinLength}
                    </Typography>
                    <Slider
                      value={taskSettings.textSplitMinLength || 1500}
                      onChange={handleSliderChange('textSplitMinLength')}
                      aria-labelledby="text-split-min-length-slider"
                      valueLabelDisplay="auto"
                      step={100}
                      marks
                      min={100}
                      max={5000}
                    />

                    <Typography id="text-split-max-length-slider" gutterBottom sx={{ mt: 3 }}>
                      {t('settings.maxLength')}: {taskSettings.textSplitMaxLength}
                    </Typography>
                    <Slider
                      value={taskSettings.textSplitMaxLength || 2000}
                      onChange={handleSliderChange('textSplitMaxLength')}
                      aria-labelledby="text-split-max-length-slider"
                      valueLabelDisplay="auto"
                      step={100}
                      marks
                      min={1000}
                      max={10000}
                    />
                  </>
                )}

                {/* 通用 LangChain 参数设置 */}
                {taskSettings.splitType && taskSettings.splitType !== 'markdown' && (
                  <>
                    <Typography id="chunk-size-slider" gutterBottom>
                      {t('settings.chunkSize')}: {taskSettings.chunkSize || 1500}
                    </Typography>
                    <Slider
                      value={taskSettings.chunkSize || 1500}
                      onChange={handleSliderChange('chunkSize')}
                      aria-labelledby="chunk-size-slider"
                      valueLabelDisplay="auto"
                      step={100}
                      marks
                      min={500}
                      max={8000}
                    />

                    <Typography id="chunk-overlap-slider" gutterBottom sx={{ mt: 3 }}>
                      {t('settings.chunkOverlap')}: {taskSettings.chunkOverlap || 200}
                    </Typography>
                    <Slider
                      value={taskSettings.chunkOverlap || 200}
                      onChange={handleSliderChange('chunkOverlap')}
                      aria-labelledby="chunk-overlap-slider"
                      valueLabelDisplay="auto"
                      step={50}
                      marks
                      min={0}
                      max={1000}
                    />
                  </>
                )}

                {/* Text 分块器特殊设置 */}
                {taskSettings.splitType === 'text' && (
                  <TextField
                    fullWidth
                    label={t('settings.separator')}
                    name="separator"
                    value={taskSettings.separator || '\\n\\n'}
                    onChange={handleSettingChange}
                    helperText={t('settings.separatorHelper')}
                    sx={{ mt: 3 }}
                  />
                )}

                {/* Code 分块器特殊设置 */}
                {taskSettings.splitType === 'code' && (
                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel id="code-language-label">{t('settings.codeLanguage')}</InputLabel>
                    <Select
                      labelId="code-language-label"
                      value={taskSettings.splitLanguage || 'js'}
                      label={t('settings.codeLanguage')}
                      name="splitLanguage"
                      onChange={handleSettingChange}
                    >
                      <MenuItem value="js">JavaScript</MenuItem>
                      <MenuItem value="python">Python</MenuItem>
                      <MenuItem value="java">Java</MenuItem>
                      <MenuItem value="go">Go</MenuItem>
                      <MenuItem value="ruby">Ruby</MenuItem>
                      <MenuItem value="cpp">C++</MenuItem>
                      <MenuItem value="c">C</MenuItem>
                      <MenuItem value="csharp">C#</MenuItem>
                      <MenuItem value="php">PHP</MenuItem>
                      <MenuItem value="rust">Rust</MenuItem>
                      <MenuItem value="typescript">TypeScript</MenuItem>
                      <MenuItem value="swift">Swift</MenuItem>
                      <MenuItem value="kotlin">Kotlin</MenuItem>
                      <MenuItem value="scala">Scala</MenuItem>
                    </Select>
                    <FormHelperText>{t('settings.codeLanguageHelper')}</FormHelperText>
                  </FormControl>
                )}

                {/* Recursive 分块器特殊设置 */}
                {taskSettings.splitType === 'recursive' && (
                  <Box sx={{ mt: 3 }}>
                    <Typography gutterBottom>{t('settings.separators')}</Typography>
                    <TextField
                      fullWidth
                      label={t('settings.separatorsInput')}
                      name="separatorsInput"
                      value={taskSettings.separatorsInput || '|,##,>,-'}
                      onChange={e => {
                        const value = e.target.value;
                        // 同时更新输入框值和分隔符数组
                        setTaskSettings(prev => ({
                          ...prev,
                          separatorsInput: value,
                          separators: value.split(',').map(item => item.trim())
                        }));
                      }}
                      helperText={t('settings.separatorsHelper')}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {(taskSettings.separators || ['|', '##', '>', '-']).map((sep, index) => (
                        <Chip key={index} label={sep} variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                  {t('settings.textSplitDescription')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Grid container spacing={3}>
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
                  step={10}
                  marks
                  min={10}
                  max={1000}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {t('settings.questionGenDescription')}
                </Typography>

                <Typography id="question-mark-removing-probability-slider" gutterBottom sx={{ mt: 3 }}>
                  {t('settings.questionMaskRemovingProbability', {
                    probability: taskSettings.questionMaskRemovingProbability
                  })}
                </Typography>
                <Slider
                  value={taskSettings.questionMaskRemovingProbability}
                  onChange={handleSliderChange('questionMaskRemovingProbability')}
                  aria-labelledby="question-generation-length-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                />

                <TextField
                  style={{ marginTop: 20 }}
                  fullWidth
                  label={t('settings.concurrencyLimit')}
                  name="concurrencyLimit"
                  value={taskSettings.concurrencyLimit}
                  onChange={handleSettingChange}
                  type="number"
                  helperText={t('settings.concurrencyLimitHelper')}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                {t('settings.pdfSettings')}
              </Typography>
              <TextField
                fullWidth
                label={t('settings.minerUToken')}
                name="minerUToken"
                value={taskSettings.minerUToken}
                onChange={handleSettingChange}
                type="password"
                helperText={t('settings.minerUHelper')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settings.minerULocalUrl')}
                name="minerULocalUrl"
                value={taskSettings.minerULocalUrl}
                onChange={handleSettingChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settings.visionConcurrencyLimit')}
                name="visionConcurrencyLimit"
                value={taskSettings.visionConcurrencyLimit ? taskSettings.visionConcurrencyLimit : 5}
                onChange={handleSettingChange}
                type="number"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                {t('settings.datasetUpload')}
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
          </Grid>
        </CardContent>
      </Card>
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {t('settings.saveSuccess')}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      {/* 吸底保存按钮 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          boxShadow: 3
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<SaveIcon />}
          onClick={handleSaveTaskSettings}
        >
          {t('settings.saveTaskConfig')}
        </Button>
      </Box>
    </Box>
  );
}
