// LocalExportTab.js 组件
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';

const LocalExportTab = ({
  fileFormat,
  formatType,
  systemPrompt,
  confirmedOnly,
  includeCOT,
  customFields,
  alpacaFieldType,
  customInstruction,
  handleFileFormatChange,
  handleFormatChange,
  handleSystemPromptChange,
  handleConfirmedOnlyChange,
  handleIncludeCOTChange,
  handleCustomFieldChange,
  handleIncludeLabelsChange,
  handleIncludeChunkChange,
  handleAlpacaFieldTypeChange,
  handleCustomInstructionChange,
  handleExport,
  projectId
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // 平衡导出相关状态
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [tagStats, setTagStats] = useState([]);
  const [balanceConfig, setBalanceConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // 获取标签统计信息
  const fetchTagStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/datasets/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmed: confirmedOnly })
      });

      if (!response.ok) {
        throw new Error(t('errors.getTagStatsFailed'));
      }

      const stats = await response.json();
      setTagStats(stats);

      // 初始化平衡配置
      const initialConfig = stats.map(stat => ({
        tagLabel: stat.tagLabel,
        maxCount: Math.min(stat.datasetCount, 100), // 默认最多100条
        availableCount: stat.datasetCount
      }));

      setBalanceConfig(initialConfig);

      // 计算总数
      const total = initialConfig.reduce((sum, config) => sum + config.maxCount, 0);
      setTotalCount(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 打开平衡导出对话框
  const handleOpenBalanceDialog = () => {
    setBalanceDialogOpen(true);
    fetchTagStats();
  };

  // 更新单个标签的数量配置
  const updateBalanceConfig = (tagLabel, newCount) => {
    const newConfig = balanceConfig.map(config => {
      if (config.tagLabel === tagLabel) {
        const count = Math.min(Math.max(0, parseInt(newCount) || 0), config.availableCount);
        return { ...config, maxCount: count };
      }
      return config;
    });

    setBalanceConfig(newConfig);

    // 重新计算总数
    const total = newConfig.reduce((sum, config) => sum + config.maxCount, 0);
    setTotalCount(total);
  };

  // 一键设置所有标签为相同数量
  const setAllToSameCount = count => {
    const newConfig = balanceConfig.map(config => ({
      ...config,
      maxCount: Math.min(Math.max(0, parseInt(count) || 0), config.availableCount)
    }));

    setBalanceConfig(newConfig);

    const total = newConfig.reduce((sum, config) => sum + config.maxCount, 0);
    setTotalCount(total);
  };

  // 处理平衡导出
  const handleBalancedExport = () => {
    // 过滤出数量大于0的配置
    const validConfig = balanceConfig.filter(config => config.maxCount > 0);

    if (validConfig.length === 0) {
      setError(t('export.balancedExport.atLeastOneTag', '请至少为一个标签设置大于0的数量'));
      return;
    }

    // 调用原有的导出函数，但传递平衡配置
    handleExport({
      balanceMode: true,
      balanceConfig: validConfig,
      formatType,
      systemPrompt,
      confirmedOnly,
      fileFormat,
      includeCOT,
      alpacaFieldType,
      customInstruction,
      customFields: formatType === 'custom' ? customFields : undefined
    });

    setBalanceDialogOpen(false);
  };

  // 自定义格式的示例
  const getCustomFormatExample = () => {
    const { questionField, answerField, cotField, includeLabels, includeChunk } = customFields;
    const example = {
      [questionField]: t('sampleData.questionContent'),
      [answerField]: t('sampleData.answerContent')
    };

    // 如果包含思维链字段，添加到示例中
    if (includeCOT) {
      example[cotField] = t('sampleData.cotContent');
    }

    if (includeLabels) {
      example.labels = [t('sampleData.domainLabel')];
    }

    if (includeChunk) {
      example.chunk = t('sampleData.textChunk');
    }

    return fileFormat === 'json' ? JSON.stringify([example], null, 2) : JSON.stringify(example);
  };

  // CSV 自定义格式化示例
  const getPreviewData = () => {
    if (formatType === 'alpaca') {
      // 根据选择的字段类型生成不同的示例
      if (alpacaFieldType === 'instruction') {
        return {
          headers: ['instruction', 'input', 'output', 'system'],
          rows: [
            {
              instruction: '人类指令（必填）',
              input: '',
              output: '模型回答（必填）',
              system: '系统提示词（选填）'
            },
            {
              instruction: '第二个指令',
              input: '',
              output: '第二个回答',
              system: '系统提示词'
            }
          ]
        };
      } else {
        // input
        return {
          headers: ['instruction', 'input', 'output', 'system'],
          rows: [
            {
              instruction: customInstruction || '固定的指令内容',
              input: '人类问题（必填）',
              output: '模型回答（必填）',
              system: '系统提示词（选填）'
            },
            {
              instruction: customInstruction || '固定的指令内容',
              input: '第二个问题',
              output: '第二个回答',
              system: '系统提示词'
            }
          ]
        };
      }
    } else if (formatType === 'sharegpt') {
      return {
        headers: ['messages'],
        rows: [
          {
            messages: JSON.stringify(
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
          }
        ]
      };
    } else if (formatType === 'custom') {
      const headers = [customFields.questionField, customFields.answerField];
      if (includeCOT) headers.push(customFields.cotField);
      if (customFields.includeLabels) headers.push('labels');
      if (customFields.includeChunk) headers.push('chunkId');

      const row = {
        [customFields.questionField]: t('sampleData.questionContent'),
        [customFields.answerField]: t('sampleData.answerContent')
      };
      if (includeCOT) row[customFields.cotField] = t('sampleData.cotContent');
      if (customFields.includeLabels) row.labels = t('sampleData.domainLabel');
      if (customFields.includeChunk) row.chunkId = t('sampleData.textChunk');
      return {
        headers,
        rows: [row]
      };
    }
  };

  return (
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
            <FormControlLabel value="csv" control={<Radio />} label="CSV" />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* 数据集风格 */}
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

      {/* Alpaca 格式特有的设置 */}
      {formatType === 'alpaca' && (
        <Box sx={{ mb: 3, pl: 2, borderLeft: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('export.alpacaSettings') || 'Alpaca 格式设置'}
          </Typography>
          <FormControl component="fieldset">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('export.questionFieldType') || '问题字段类型'}
            </Typography>
            <RadioGroup
              aria-label="alpacaFieldType"
              name="alpacaFieldType"
              value={alpacaFieldType}
              onChange={handleAlpacaFieldTypeChange}
              row
            >
              <FormControlLabel
                value="instruction"
                control={<Radio />}
                label={t('export.useInstruction') || '使用 instruction 字段'}
              />
              <FormControlLabel value="input" control={<Radio />} label={t('export.useInput') || '使用 input 字段'} />
            </RadioGroup>

            {alpacaFieldType === 'input' && (
              <TextField
                fullWidth
                size="small"
                label={t('export.customInstruction') || '自定义 instruction 字段内容'}
                value={customInstruction}
                onChange={handleCustomInstructionChange}
                margin="normal"
                placeholder={t('export.instructionPlaceholder') || '请输入固定的指令内容'}
                helperText={
                  t('export.instructionHelperText') || '当使用 input 字段时，可以在这里指定固定的 instruction 内容'
                }
              />
            )}
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
          {/* <FormControlLabel
            control={<Checkbox checked={customFields.includeChunk} onChange={handleIncludeChunkChange} size="small" />}
            label={t('export.includeChunk')}
          /> */}
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {t('export.example')}
        </Typography>

        {fileFormat === 'csv' ? (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            {(() => {
              const { headers, rows } = getPreviewData();
              const tableKey = `${formatType}-${fileFormat}-${JSON.stringify(customFields)}`;
              return (
                <Table size="small" key={tableKey}>
                  <TableHead>
                    <TableRow>
                      {headers.map(header => (
                        <TableCell key={header}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={index}>
                        {headers.map(header => (
                          <TableCell key={header}>
                            {Array.isArray(row[header]) ? row[header].join(', ') : row[header] || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </TableContainer>
        ) : (
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
        )}
      </Box>

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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button onClick={handleOpenBalanceDialog} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('exportDialog.balancedExport')}
        </Button>
        <Button onClick={handleExport} variant="contained" sx={{ borderRadius: 2 }}>
          {t('export.confirmExport')}
        </Button>
      </Box>

      {/* 平衡导出对话框 */}
      <Dialog
        open={balanceDialogOpen}
        onClose={() => setBalanceDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>{t('exportDialog.balancedExportTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            {t('exportDialog.balancedExportDescription')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* 批量设置 */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('exportDialog.quickSettings')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button size="small" onClick={() => setAllToSameCount(50)}>
                    {t('exportDialog.setAllTo50')}
                  </Button>
                  <Button size="small" onClick={() => setAllToSameCount(100)}>
                    {t('exportDialog.setAllTo100')}
                  </Button>
                  <Button size="small" onClick={() => setAllToSameCount(200)}>
                    {t('exportDialog.setAllTo200')}
                  </Button>
                  <TextField
                    size="small"
                    type="number"
                    placeholder={t('exportDialog.customAmount')}
                    sx={{ width: 120 }}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        setAllToSameCount(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* 标签配置表格 */}
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('exportDialog.tagName')}</TableCell>
                      <TableCell align="right">{t('exportDialog.availableCount')}</TableCell>
                      <TableCell align="right">{t('exportDialog.exportCount')}</TableCell>
                      <TableCell align="right">{t('exportDialog.settings')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {balanceConfig.map(config => (
                      <TableRow key={config.tagLabel}>
                        <TableCell>
                          <Chip label={config.tagLabel} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{config.availableCount}</TableCell>
                        <TableCell align="right">
                          <strong>{config.maxCount}</strong>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={config.maxCount}
                            onChange={e => updateBalanceConfig(config.tagLabel, e.target.value)}
                            inputProps={{
                              min: 0,
                              max: config.availableCount,
                              style: { textAlign: 'right' }
                            }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 统计信息 */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>{t('exportDialog.totalExportCount')}: {totalCount}</strong> | {t('exportDialog.tagCount')}:{' '}
                  {balanceConfig.filter(c => c.maxCount > 0).length} / {balanceConfig.length}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBalanceDialogOpen(false)}>{t('common.cancel', '取消')}</Button>
          <Button variant="contained" onClick={handleBalancedExport} disabled={loading || totalCount === 0}>
            {t('exportDialog.export')} ({totalCount})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LocalExportTab;
