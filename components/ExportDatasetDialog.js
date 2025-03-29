// ExportDatasetDialog.js 组件
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Checkbox,
  Typography,
  Box,
  Paper,
  useTheme,
  Grid,
  Divider,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

const ExportDatasetDialog = ({ open, onClose, onExport, projectId }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [formatType, setFormatType] = useState('alpaca');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [confirmedOnly, setConfirmedOnly] = useState(false);
  const [fileFormat, setFileFormat] = useState('json');
  // 新增状态
  const [includeCOT, setIncludeCOT] = useState(true);
  // 新增标签页相关状态
  const [currentTab, setCurrentTab] = useState(0);
  const [configExists, setConfigExists] = useState(false);
  const [configPath, setConfigPath] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [customFields, setCustomFields] = useState({
    questionField: 'instruction',
    answerField: 'output',
    cotField: 'complexCOT', // 添加思维链字段名
    includeLabels: false
  });
  const [copied, setCopied] = useState(false);

  const handleFileFormatChange = event => {
    setFileFormat(event.target.value);
  };

  const handleFormatChange = event => {
    setFormatType(event.target.value);
    // 根据格式类型设置默认字段名
    if (event.target.value === 'alpaca') {
      setCustomFields({
        ...customFields,
        questionField: 'instruction',
        answerField: 'output'
      });
    } else if (event.target.value === 'sharegpt') {
      setCustomFields({
        ...customFields,
        questionField: 'content',
        answerField: 'content'
      });
    } else if (event.target.value === 'custom') {
      // 自定义格式保持当前值
    }
  };

  const handleSystemPromptChange = event => {
    setSystemPrompt(event.target.value);
  };

  const handleConfirmedOnlyChange = event => {
    setConfirmedOnly(event.target.checked);
  };

  // 新增处理函数
  const handleIncludeCOTChange = event => {
    setIncludeCOT(event.target.checked);
  };

  const handleCustomFieldChange = field => event => {
    setCustomFields({
      ...customFields,
      [field]: event.target.value
    });
  };

  const handleIncludeLabelsChange = event => {
    setCustomFields({
      ...customFields,
      includeLabels: event.target.checked
    });
  };

  const handleExport = () => {
    onExport({
      formatType,
      systemPrompt,
      confirmedOnly,
      fileFormat,
      includeCOT,
      customFields: formatType === 'custom' ? customFields : undefined
    });
  };

  // 复制路径到剪贴板
  const handleCopyPath = () => {
    const path = configPath.replace('dataset_info.json', '');
    navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 自定义格式的示例
  const getCustomFormatExample = () => {
    const { questionField, answerField, cotField, includeLabels } = customFields;
    const example = {
      [questionField]: '问题内容',
      [answerField]: '答案内容'
    };

    // 如果包含思维链字段，添加到示例中
    if (includeCOT) {
      example[cotField] = '思维链过程内容';
    }

    if (includeLabels) {
      example.labels = ['领域标签1'];
    }

    return fileFormat === 'json' ? JSON.stringify([example], null, 2) : JSON.stringify(example);
  };

  // 检查配置文件是否存在
  useEffect(() => {
    if (currentTab === 1 && projectId) {
      fetch(`/api/projects/${projectId}/llamaFactory/checkConfig`)
        .then(res => res.json())
        .then(data => {
          setConfigExists(data.exists);
          if (data.exists) {
            setConfigPath(data.configPath);
          }
        })
        .catch(err => {
          setError(err.message);
        });
    }
  }, [currentTab, projectId]);

  // 处理生成 Llama Factory 配置
  const handleGenerateConfig = async () => {
    try {
      setGenerating(true);
      setError('');

      const response = await fetch(`/api/projects/${projectId}/llamaFactory/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formatType,
          systemPrompt,
          confirmedOnly,
          includeCOT
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      setConfigExists(true);
      setConfigPath(data.configPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>{t('export.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} aria-label="export tabs">
            <Tab label={t('export.localTab')} />
            <Tab label={t('export.llamaFactoryTab')} />
            <Tab label={t('export.huggingFaceTab')} disabled />
          </Tabs>
        </Box>

        {/* 第一个标签页：本地导出（保持原有功能） */}
        {currentTab === 0 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('export.fileFormat')}
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="fileFormat"
                  name="fileFormat"
                  value={fileFormat}
                  onChange={handleFileFormatChange}
                  row
                >
                  <FormControlLabel value="json" control={<Radio />} label="JSON" />
                  <FormControlLabel value="jsonl" control={<Radio />} label="JSONL" />
                  {/* <FormControlLabel value="csv" control={<Radio />} label="CSV" /> */}
                  {/* 暂时注释，修复完问题后再放开 */}
                </RadioGroup>
              </FormControl>
            </Box>

            {/* 数据集风格 */}
            {fileFormat !== 'csv' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {t('export.format')}
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup aria-label="format" name="format" value={formatType} onChange={handleFormatChange} row>
                    <FormControlLabel value="alpaca" control={<Radio />} label="Alpaca" />
                    <FormControlLabel value="sharegpt" control={<Radio />} label="ShareGPT" />
                    <FormControlLabel value="custom" control={<Radio />} label={t('export.customFormat')} />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            {/* 自定义格式选项 */}
            {formatType === 'custom' && (
              <Box sx={{ mb: 3, pl: 2, borderLeft: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('export.customFormatSettings')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('export.questionFieldName')}
                      value={customFields.questionField}
                      onChange={handleCustomFieldChange('questionField')}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('export.answerFieldName')}
                      value={customFields.answerField}
                      onChange={handleCustomFieldChange('answerField')}
                      margin="normal"
                    />
                  </Grid>
                  {/* 添加思维链字段名输入框 */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('export.cotFieldName')}
                      value={customFields.cotField}
                      onChange={handleCustomFieldChange('cotField')}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  control={
                    <Checkbox checked={customFields.includeLabels} onChange={handleIncludeLabelsChange} size="small" />
                  }
                  label={t('export.includeLabels')}
                />
              </Box>
            )}

            {fileFormat !== 'csv' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {t('export.example')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
                    overflowX: 'auto'
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {formatType === 'custom'
                      ? getCustomFormatExample()
                      : formatType === 'alpaca'
                        ? fileFormat === 'json'
                          ? JSON.stringify(
                              [
                                {
                                  instruction: '人类指令（必填）', // 映射到 question 字段
                                  input: '人类输入（选填）',
                                  output: '模型回答（必填）', // 映射到 cot+answer 字段
                                  system: '系统提示词（选填）'
                                }
                              ],
                              null,
                              2
                            )
                          : '{"instruction": "人类指令（必填）", "input": "人类输入（选填）", "output": "模型回答（必填）", "system": "系统提示词（选填）"}\n{"instruction": "第二个指令", "input": "", "output": "第二个回答", "system": "系统提示词"}'
                        : fileFormat === 'json'
                          ? JSON.stringify(
                              [
                                {
                                  messages: [
                                    {
                                      role: 'system',
                                      content: '系统提示词（选填）'
                                    },
                                    {
                                      role: 'user',
                                      content: '人类指令' // 映射到 question 字段
                                    },
                                    {
                                      role: 'assistant',
                                      content: '模型回答' // 映射到 cot+answer 字段
                                    }
                                  ]
                                }
                              ],
                              null,
                              2
                            )
                          : '{"messages": [{"role": "system", "content": "系统提示词（选填）"}, {"role": "user", "content": "人类指令"}, {"role": "assistant", "content": "模型回答"}]}\n{"messages": [{"role": "user", "content": "第二个问题"}, {"role": "assistant", "content": "第二个回答"}]}'}
                  </pre>
                </Paper>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('export.systemPrompt')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder={t('export.systemPromptPlaceholder')}
                value={systemPrompt}
                onChange={handleSystemPromptChange}
              />
            </Box>

            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'row', gap: 4 }}>
              <FormControlLabel
                control={<Checkbox checked={confirmedOnly} onChange={handleConfirmedOnlyChange} />}
                label={t('export.onlyConfirmed')}
              />

              <FormControlLabel
                control={<Checkbox checked={includeCOT} onChange={handleIncludeCOTChange} />}
                label={t('export.includeCOT')}
              />
            </Box>
          </>
        )}

        {/* 第二个标签页：Llama Factory */}
        {currentTab === 1 && (
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('export.systemPrompt')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                variant="outlined"
              />
            </Box>

            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'row', gap: 4 }}>
              <FormControlLabel
                control={<Checkbox checked={confirmedOnly} onChange={handleConfirmedOnlyChange} />}
                label={t('export.onlyConfirmed')}
              />

              <FormControlLabel
                control={<Checkbox checked={includeCOT} onChange={handleIncludeCOTChange} />}
                label={t('export.includeCOT')}
              />
            </Box>

            {configExists ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  {t('export.configExists')}
                </Alert>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('export.configPath')}: {configPath.replace('dataset_info.json', '')}
                  </Typography>
                  <Tooltip title={copied ? t('common.copied') : t('common.copy')}>
                    <IconButton size="small" onClick={handleCopyPath} sx={{ ml: 1 }}>
                      {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('export.noConfig')}
              </Typography>
            )}
          </Box>
        )}

        {/* 第三个标签页：HuggingFace */}
        {currentTab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">{t('export.huggingFaceComingSoon')}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('common.cancel')}
        </Button>
        {currentTab === 0 && (
          <Button onClick={handleExport} variant="contained" sx={{ borderRadius: 2 }}>
            {t('export.confirmExport')}
          </Button>
        )}
        {currentTab === 1 && (
          <Button onClick={handleGenerateConfig} variant="contained" disabled={generating} sx={{ borderRadius: 2 }}>
            {generating ? (
              <CircularProgress size={24} />
            ) : configExists ? (
              t('export.updateConfig')
            ) : (
              t('export.generateConfig')
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportDatasetDialog;
