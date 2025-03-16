// ExportDatasetDialog.js 组件
import React, { useState } from 'react';
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
    Divider
} from '@mui/material';

const ExportDatasetDialog = ({ open, onClose, onExport }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [formatType, setFormatType] = useState('alpaca');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [confirmedOnly, setConfirmedOnly] = useState(false);
    const [fileFormat, setFileFormat] = useState('json');
    // 新增状态
    const [includeCOT, setIncludeCOT] = useState(true);
    const [customFields, setCustomFields] = useState({
        questionField: 'instruction',
        answerField: 'output',
        cotField: 'complexCOT',  // 添加思维链字段名
        includeLabels: false
    });

    const handleFileFormatChange = (event) => {
        setFileFormat(event.target.value);
    };

    const handleFormatChange = (event) => {
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

    const handleSystemPromptChange = (event) => {
        setSystemPrompt(event.target.value);
    };

    const handleConfirmedOnlyChange = (event) => {
        setConfirmedOnly(event.target.checked);
    };

    // 新增处理函数
    const handleIncludeCOTChange = (event) => {
        setIncludeCOT(event.target.checked);
    };

    const handleCustomFieldChange = (field) => (event) => {
        setCustomFields({
            ...customFields,
            [field]: event.target.value
        });
    };

    const handleIncludeLabelsChange = (event) => {
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

    // 自定义格式的示例
    const getCustomFormatExample = () => {
        const { questionField, answerField, cotField, includeLabels } = customFields;
        const example = {
            [questionField]: "问题内容",
            [answerField]: "答案内容"
        };

        // 如果包含思维链字段，添加到示例中
        if (includeCOT) {
            example[cotField] = "思维链过程内容";
        }

        if (includeLabels) {
            example.labels = ["领域标签1"];
        }

        return fileFormat === 'json'
            ? JSON.stringify([example], null, 2)
            : JSON.stringify(example);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('export.title')}</DialogTitle>
            <DialogContent>
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
                        </RadioGroup>
                    </FormControl>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {t('export.format')}
                    </Typography>
                    <FormControl component="fieldset">
                        <RadioGroup
                            aria-label="format"
                            name="format"
                            value={formatType}
                            onChange={handleFormatChange}
                            row
                        >
                            <FormControlLabel value="alpaca" control={<Radio />} label="Alpaca" />
                            <FormControlLabel value="sharegpt" control={<Radio />} label="ShareGPT" />
                            <FormControlLabel value="custom" control={<Radio />} label={t('export.customFormat')} />
                        </RadioGroup>
                    </FormControl>
                </Box>

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
                                <Checkbox
                                    checked={customFields.includeLabels}
                                    onChange={handleIncludeLabelsChange}
                                    size="small"
                                />
                            }
                            label={t('export.includeLabels')}
                        />
                    </Box>
                )}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {t('export.example')}
                    </Typography>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.mode === 'dark'
                                ? theme.palette.grey[900]
                                : theme.palette.grey[100],
                            overflowX: 'auto'
                        }}
                    >
                        <pre style={{ margin: 0 }}>
                            {formatType === 'custom'
                                ? getCustomFormatExample()
                                : (formatType === 'alpaca'
                                    ? (fileFormat === 'json'
                                        ? JSON.stringify([
                                            {
                                                "instruction": "人类指令（必填）",  // 映射到 question 字段
                                                "input": "人类输入（选填）",
                                                "output": "模型回答（必填）", // 映射到 cot+answer 字段
                                                "system": "系统提示词（选填）"
                                            }
                                        ], null, 2)
                                        : '{"instruction": "人类指令（必填）", "input": "人类输入（选填）", "output": "模型回答（必填）", "system": "系统提示词（选填）"}\n{"instruction": "第二个指令", "input": "", "output": "第二个回答", "system": "系统提示词"}')
                                    : (fileFormat === 'json'
                                        ? JSON.stringify([
                                            {
                                                "messages": [
                                                    {
                                                        "role": "system",
                                                        "content": "系统提示词（选填）"
                                                    },
                                                    {
                                                        "role": "user",
                                                        "content": "人类指令" // 映射到 question 字段
                                                    },
                                                    {
                                                        "role": "assistant",
                                                        "content": "模型回答" // 映射到 cot+answer 字段
                                                    }
                                                ]
                                            }
                                        ], null, 2)
                                        : '{"messages": [{"role": "system", "content": "系统提示词（选填）"}, {"role": "user", "content": "人类指令"}, {"role": "assistant", "content": "模型回答"}]}\n{"messages": [{"role": "user", "content": "第二个问题"}, {"role": "assistant", "content": "第二个回答"}]}')
                                )
                            }
                        </pre>
                    </Paper>
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
                        control={
                            <Checkbox
                                checked={confirmedOnly}
                                onChange={handleConfirmedOnlyChange}
                            />
                        }
                        label={t('export.onlyConfirmed')}
                    />

                    <Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeCOT}
                                    onChange={handleIncludeCOTChange}
                                />
                            }
                            label={t('export.includeCOT')}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleExport} variant="contained" color="primary">
                    {t('export.confirmExport')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportDatasetDialog;