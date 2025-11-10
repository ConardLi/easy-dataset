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
  FormHelperText,
  useTheme,
  IconButton
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import SaveIcon from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useTaskSettings from '@/hooks/useTaskSettings';

export default function TaskSettings({ projectId }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { taskSettings, setTaskSettings, loading, error, success, setSuccess } = useTaskSettings(projectId);
  const [passwordVisibility, setPasswordVisibility] = useState({
    minerUToken: false,
    huggingfaceToken: false
  });

  // 确保 multiTurnRounds 有正确的初始值
  useEffect(() => {
    if (
      !loading &&
      taskSettings &&
      (taskSettings.multiTurnRounds === undefined || taskSettings.multiTurnRounds === null)
    ) {
      setTaskSettings(prev => ({
        ...prev,
        multiTurnRounds: 3 // 默认值
      }));
    }
  }, [loading, taskSettings, setTaskSettings]);

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

  const toggleVisibility = field => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
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
    return (
      <Typography sx={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
        {t('common.loading')}
      </Typography>
    );
  }

  // 统一的表单样式
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
      color: isDark ? '#F8FAFC' : '#0F172A',
      border: `1.5px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
      borderRadius: '12px',
      '&:hover': {
        borderColor: theme.palette.primary.main
      },
      '&.Mui-focused': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'}`
      }
    },
    '& .MuiInputLabel-root': {
      color: isDark ? '#CBD5E1' : '#475569',
      fontWeight: 600,
      '&.Mui-focused': {
        color: theme.palette.primary.main
      }
    },
    '& .MuiInputBase-input': {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontWeight: 500
    },
    '& .MuiFormHelperText-root': {
      color: isDark ? '#94A3B8' : '#64748B',
      fontWeight: 500
    }
  };

  const selectSx = {
    bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1.5px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
    borderRadius: '12px',
    fontWeight: 600,
    '&:hover': {
      borderColor: theme.palette.primary.main
    },
    '&.Mui-focused': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
      boxShadow: `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'}`
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none'
    }
  };

  const sliderSx = {
    '& .MuiSlider-thumb': {
      bgcolor: theme.palette.primary.main,
      border: `3px solid ${isDark ? '#1E293B' : '#FFFFFF'}`,
      width: 20,
      height: 20,
      boxShadow: `0 0 0 4px ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`
    },
    '& .MuiSlider-track': {
      bgcolor: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
      border: 'none',
      height: 6
    },
    '& .MuiSlider-rail': {
      bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
      height: 6
    },
    '& .MuiSlider-valueLabel': {
      bgcolor: theme.palette.primary.main,
      color: '#FFFFFF',
      fontWeight: 700,
      fontSize: '0.75rem',
      borderRadius: '8px',
      '&::before': {
        display: 'none'
      }
    }
  };

  const cardSx = {
    bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
    borderRadius: '16px',
    boxShadow: isDark
      ? '0 4px 24px rgba(0, 0, 0, 0.3)'
      : '0 4px 24px rgba(15, 23, 42, 0.08)',
    mb: 2.5
  };

  return (
    <Box sx={{ position: 'relative', pb: 8 }}>
      {/* 添加底部填充，为固定按钮留出空间 */}
      <Card sx={cardSx}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  mb: 3
                }}
              >
                {t('settings.textSplitSettings')}
              </Typography>
              <Box sx={{ px: 2, py: 1 }}>
                {/* 分块策略选择 */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel 
                    id="split-type-label"
                    sx={{
                      color: isDark ? '#CBD5E1' : '#475569',
                      fontWeight: 600,
                      '&.Mui-focused': {
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    {t('settings.splitType')}
                  </InputLabel>
                  <Select
                    labelId="split-type-label"
                    value={taskSettings.splitType || 'recursive'}
                    label={t('settings.splitType')}
                    name="splitType"
                    onChange={handleSettingChange}
                    sx={selectSx}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: '16px',
                          mt: 1,
                          bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                          boxShadow: isDark
                            ? '0 12px 48px rgba(0, 0, 0, 0.5)'
                            : '0 12px 48px rgba(15, 23, 42, 0.15)',
                          '& .MuiMenuItem-root': {
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            fontWeight: 600,
                            borderRadius: '10px',
                            mx: 0.75,
                            my: 0.5,
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
                            },
                            '&.Mui-selected': {
                              bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                              color: '#FFFFFF',
                              '&:hover': {
                                bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                              }
                            },
                            '& .MuiTypography-root': {
                              color: 'inherit'
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="markdown">
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: 'inherit',
                            fontWeight: 600
                          }}
                        >
                          {t('settings.splitTypeMarkdown')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: isDark ? '#94A3B8' : '#64748B',
                            mt: 0.5
                          }}
                        >
                          {t('settings.splitTypeMarkdownDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="recursive">
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: 'inherit',
                            fontWeight: 600
                          }}
                        >
                          {t('settings.splitTypeRecursive')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: isDark ? '#94A3B8' : '#64748B',
                            mt: 0.5
                          }}
                        >
                          {t('settings.splitTypeRecursiveDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="text">
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: 'inherit',
                            fontWeight: 600
                          }}
                        >
                          {t('settings.splitTypeText')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: isDark ? '#94A3B8' : '#64748B',
                            mt: 0.5
                          }}
                        >
                          {t('settings.splitTypeTextDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="token">
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: 'inherit',
                            fontWeight: 600
                          }}
                        >
                          {t('settings.splitTypeToken')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: isDark ? '#94A3B8' : '#64748B',
                            mt: 0.5
                          }}
                        >
                          {t('settings.splitTypeTokenDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="code">
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: 'inherit',
                            fontWeight: 600
                          }}
                        >
                          {t('settings.splitTypeCode')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: isDark ? '#94A3B8' : '#64748B',
                            mt: 0.5
                          }}
                        >
                          {t('settings.splitTypeCodeDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                    {/* 添加自定义符号分割策略选项 */}
                    <MenuItem value="custom">
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: 'inherit',
                            fontWeight: 600
                          }}
                        >
                          {t('settings.splitTypeCustom')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: isDark ? '#94A3B8' : '#64748B',
                            mt: 0.5
                          }}
                        >
                          {t('settings.splitTypeCustomDesc')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Markdown模式设置 */}
                {(!taskSettings.splitType || taskSettings.splitType === 'markdown') && (
                  <>
                    <Typography 
                      id="text-split-min-length-slider" 
                      gutterBottom
                      sx={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 2
                      }}
                    >
                      {t('settings.minLength')}: {taskSettings.textSplitMinLength}
                    </Typography>
                    <Slider
                      value={taskSettings.textSplitMinLength || 2000}
                      onChange={handleSliderChange('textSplitMinLength')}
                      aria-labelledby="text-split-min-length-slider"
                      valueLabelDisplay="auto"
                      step={100}
                      marks
                      min={100}
                      max={5000}
                      sx={sliderSx}
                    />

                    <Typography 
                      id="text-split-max-length-slider" 
                      gutterBottom 
                      sx={{ 
                        mt: 3,
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 2
                      }}
                    >
                      {t('settings.maxLength')}: {taskSettings.textSplitMaxLength}
                    </Typography>
                    <Slider
                      value={taskSettings.textSplitMaxLength || 3000}
                      onChange={handleSliderChange('textSplitMaxLength')}
                      aria-labelledby="text-split-max-length-slider"
                      valueLabelDisplay="auto"
                      step={100}
                      marks
                      min={2000}
                      max={20000}
                      sx={sliderSx}
                    />
                  </>
                )}

                {/* 通用 LangChain 参数设置 */}
                {taskSettings.splitType && taskSettings.splitType !== 'markdown' && (
                  <>
                    <Typography 
                      id="chunk-size-slider" 
                      gutterBottom
                      sx={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 2
                      }}
                    >
                      {t('settings.chunkSize')}: {taskSettings.chunkSize || 3000}
                    </Typography>
                    <Slider
                      value={taskSettings.chunkSize || 3000}
                      onChange={handleSliderChange('chunkSize')}
                      aria-labelledby="chunk-size-slider"
                      valueLabelDisplay="auto"
                      step={100}
                      marks
                      min={500}
                      max={20000}
                      sx={sliderSx}
                    />

                    <Typography 
                      id="chunk-overlap-slider" 
                      gutterBottom 
                      sx={{ 
                        mt: 3,
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 2
                      }}
                    >
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
                      sx={sliderSx}
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
                    sx={{ mt: 3, ...textFieldSx }}
                  />
                )}

                {/* 自定义符号分块器特殊设置 */}
                {taskSettings.splitType === 'custom' && (
                  <TextField
                    fullWidth
                    label={t('settings.customSeparator')}
                    name="customSeparator"
                    value={taskSettings.customSeparator || '---'}
                    onChange={handleSettingChange}
                    helperText={t('settings.customSeparatorHelper')}
                    sx={{ mt: 3, ...textFieldSx }}
                  />
                )}

                {/* Code 分块器特殊设置 */}
                {taskSettings.splitType === 'code' && (
                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel 
                      id="code-language-label"
                      sx={{
                        color: isDark ? '#CBD5E1' : '#475569',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {t('settings.codeLanguage')}
                    </InputLabel>
                    <Select
                      labelId="code-language-label"
                      value={taskSettings.splitLanguage || 'js'}
                      label={t('settings.codeLanguage')}
                      name="splitLanguage"
                      onChange={handleSettingChange}
                      sx={selectSx}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: '16px',
                            mt: 1,
                            bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                            border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                            boxShadow: isDark
                              ? '0 12px 48px rgba(0, 0, 0, 0.5)'
                              : '0 12px 48px rgba(15, 23, 42, 0.15)',
                            '& .MuiMenuItem-root': {
                              color: isDark ? '#F8FAFC' : '#0F172A',
                              fontWeight: 600,
                              borderRadius: '10px',
                              mx: 0.75,
                              my: 0.5,
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
                              },
                              '&.Mui-selected': {
                                bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                color: '#FFFFFF',
                                '&:hover': {
                                  bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                                }
                              }
                            }
                          }
                        }
                      }}
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
                    <FormHelperText
                      sx={{
                        color: isDark ? '#94A3B8' : '#64748B',
                        fontWeight: 500
                      }}
                    >
                      {t('settings.codeLanguageHelper')}
                    </FormHelperText>
                  </FormControl>
                )}

                {/* Recursive 分块器特殊设置 */}
                {taskSettings.splitType === 'recursive' && (
                  <Box sx={{ mt: 3 }}>
                    <Typography 
                      gutterBottom
                      sx={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 2
                      }}
                    >
                      {t('settings.separators')}
                    </Typography>
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
                      sx={textFieldSx}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {(taskSettings.separators || ['|', '##', '>', '-']).map((sep, index) => (
                        <Chip 
                          key={index} 
                          label={sep} 
                          variant="outlined"
                          sx={{
                            bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                            border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                            color: isDark ? '#E0E7FF' : theme.palette.primary.main,
                            fontWeight: 600
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 3,
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontWeight: 500
                  }}
                >
                  {t('settings.textSplitDescription')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={cardSx}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  mb: 3
                }}
              >
                {t('settings.questionGenSettings')}
              </Typography>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography 
                  id="question-generation-length-slider" 
                  gutterBottom
                  sx={{
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    mb: 2
                  }}
                >
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
                  sx={sliderSx}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 1,
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontWeight: 500
                  }}
                >
                  {t('settings.questionGenDescription')}
                </Typography>

                <Typography 
                  id="question-mark-removing-probability-slider" 
                  gutterBottom 
                  sx={{ 
                    mt: 3,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    mb: 2
                  }}
                >
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
                  sx={sliderSx}
                />

                <TextField
                  fullWidth
                  label={t('settings.concurrencyLimit')}
                  name="concurrencyLimit"
                  value={taskSettings.concurrencyLimit}
                  onChange={handleSettingChange}
                  type="number"
                  helperText={t('settings.concurrencyLimitHelper')}
                  sx={{ mt: 3, ...textFieldSx }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={cardSx}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  mb: 3
                }}
              >
                {t('settings.pdfSettings')}
              </Typography>
              <TextField
                fullWidth
                label={t('settings.minerUToken')}
                name="minerUToken"
                value={taskSettings.minerUToken}
                onChange={handleSettingChange}
                type={passwordVisibility.minerUToken ? 'text' : 'password'}
                helperText={t('settings.minerUHelper')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={passwordVisibility.minerUToken ? '隐藏密钥' : '显示密钥'}
                        onClick={() => toggleVisibility('minerUToken')}
                        onMouseDown={e => e.preventDefault()}
                        edge="end"
                      >
                        {passwordVisibility.minerUToken ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('settings.minerULocalUrl')}
                name="minerULocalUrl"
                value={taskSettings.minerULocalUrl}
                onChange={handleSettingChange}
                sx={textFieldSx}
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
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={cardSx}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  mb: 3
                }}
              >
                {t('settings.huggingfaceSettings')}
              </Typography>
              <TextField
                fullWidth
                label={t('settings.huggingfaceToken')}
                name="huggingfaceToken"
                value={taskSettings.huggingfaceToken || ''}
                onChange={handleSettingChange}
                type={passwordVisibility.huggingfaceToken ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={passwordVisibility.huggingfaceToken ? '隐藏密钥' : '显示密钥'}
                        onClick={() => toggleVisibility('huggingfaceToken')}
                        onMouseDown={e => e.preventDefault()}
                        edge="end"
                      >
                        {passwordVisibility.huggingfaceToken ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* 多轮对话数据集设置 */}
      <Card sx={cardSx}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  mb: 3
                }}
              >
                {t('settings.multiTurnSettings')}
              </Typography>
              <Box sx={{ px: 2, py: 1 }}>
                {/* 系统提示词 */}
                <TextField
                  fullWidth
                  label={t('settings.multiTurnSystemPrompt')}
                  name="multiTurnSystemPrompt"
                  value={taskSettings.multiTurnSystemPrompt || ''}
                  onChange={handleSettingChange}
                  multiline
                  rows={3}
                  helperText={t('settings.multiTurnSystemPromptHelper')}
                  sx={{ mb: 2, ...textFieldSx }}
                />

                {/* 对话场景 */}
                <TextField
                  fullWidth
                  label={t('settings.multiTurnScenario')}
                  name="multiTurnScenario"
                  value={taskSettings.multiTurnScenario || ''}
                  onChange={handleSettingChange}
                  helperText={t('settings.multiTurnScenarioHelper')}
                  sx={{ mb: 2, ...textFieldSx }}
                />

                {/* 对话轮数 */}
                <Typography 
                  id="multi-turn-rounds-slider" 
                  gutterBottom 
                  sx={{ 
                    mt: 2,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    mb: 2
                  }}
                >
                  {t('settings.multiTurnRounds', { rounds: taskSettings.multiTurnRounds || 3 })}
                </Typography>
                <Slider
                  value={taskSettings.multiTurnRounds || 3}
                  onChange={handleSliderChange('multiTurnRounds')}
                  aria-labelledby="multi-turn-rounds-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={2}
                  max={8}
                  sx={{ mb: 2, ...sliderSx }}
                />

                {/* 角色A设定 */}
                <TextField
                  fullWidth
                  label={t('settings.multiTurnRoleA')}
                  name="multiTurnRoleA"
                  value={taskSettings.multiTurnRoleA || ''}
                  onChange={handleSettingChange}
                  multiline
                  rows={2}
                  helperText={t('settings.multiTurnRoleAHelper')}
                  sx={{ mb: 2, ...textFieldSx }}
                />

                {/* 角色B设定 */}
                <TextField
                  fullWidth
                  label={t('settings.multiTurnRoleB')}
                  name="multiTurnRoleB"
                  value={taskSettings.multiTurnRoleB || ''}
                  onChange={handleSettingChange}
                  multiline
                  rows={2}
                  helperText={t('settings.multiTurnRoleBHelper')}
                  sx={{ mb: 2, ...textFieldSx }}
                />

                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 1,
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontWeight: 500
                  }}
                >
                  {t('settings.multiTurnDescription')}
                </Typography>
              </Box>
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
          padding: '12px',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#FFFFFF',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          boxShadow: isDark
            ? '0 -4px 24px rgba(0, 0, 0, 0.3)'
            : '0 -4px 24px rgba(15, 23, 42, 0.08)'
        }}
      >
        <Button
          variant="contained"
          size="medium"
          startIcon={<SaveIcon />}
          onClick={handleSaveTaskSettings}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
            px: 4,
            py: 1.25,
            background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#FFFFFF',
            boxShadow: isDark
              ? '0 4px 16px rgba(99, 102, 241, 0.4)'
              : '0 4px 16px rgba(99, 102, 241, 0.3)',
            '&:hover': {
              background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              transform: 'translateY(-2px)',
              boxShadow: isDark
                ? '0 6px 20px rgba(99, 102, 241, 0.5)'
                : '0 6px 20px rgba(99, 102, 241, 0.4)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {t('settings.saveTaskConfig')}
        </Button>
      </Box>
    </Box>
  );
}
