// ExportDatasetDialog.js 组件
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Tabs, Tab } from '@mui/material';

// 导入拆分后的组件
import LocalExportTab from './export/LocalExportTab';
import LlamaFactoryTab from './export/LlamaFactoryTab';
import HuggingFaceTab from './export/HuggingFaceTab';

const ExportDatasetDialog = ({ open, onClose, onExport, projectId }) => {
  const { t } = useTranslation();
  const [formatType, setFormatType] = useState('alpaca');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [confirmedOnly, setConfirmedOnly] = useState(false);
  const [fileFormat, setFileFormat] = useState('json');
  const [includeCOT, setIncludeCOT] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  // alpaca 格式特有的设置
  const [alpacaFieldType, setAlpacaFieldType] = useState('instruction'); // 'instruction' 或 'input'
  const [customInstruction, setCustomInstruction] = useState(''); // 当选择 input 时使用的自定义 instruction
  const [customFields, setCustomFields] = useState({
    questionField: 'instruction',
    answerField: 'output',
    cotField: 'complexCOT', // 添加思维链字段名
    includeLabels: false,
    includeChunk: false // 添加是否包含chunk字段
  });

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

  const handleIncludeChunkChange = event => {
    setCustomFields({
      ...customFields,
      includeChunk: event.target.checked
    });
  };

  // 处理 Alpaca 字段类型变更
  const handleAlpacaFieldTypeChange = event => {
    setAlpacaFieldType(event.target.value);
  };

  // 处理自定义 instruction 变更
  const handleCustomInstructionChange = event => {
    setCustomInstruction(event.target.value);
  };

  const handleExport = () => {
    onExport({
      formatType,
      systemPrompt,
      confirmedOnly,
      fileFormat,
      includeCOT,
      alpacaFieldType, // 添加 alpaca 字段类型
      customInstruction, // 添加自定义 instruction
      customFields: formatType === 'custom' ? customFields : undefined
    });
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
            <Tab label={t('export.huggingFaceTab')} />
          </Tabs>
        </Box>

        {/* 第一个标签页：本地导出 */}
        {currentTab === 0 && (
          <LocalExportTab
            fileFormat={fileFormat}
            formatType={formatType}
            systemPrompt={systemPrompt}
            confirmedOnly={confirmedOnly}
            includeCOT={includeCOT}
            customFields={customFields}
            alpacaFieldType={alpacaFieldType}
            customInstruction={customInstruction}
            handleFileFormatChange={handleFileFormatChange}
            handleFormatChange={handleFormatChange}
            handleSystemPromptChange={handleSystemPromptChange}
            handleConfirmedOnlyChange={handleConfirmedOnlyChange}
            handleIncludeCOTChange={handleIncludeCOTChange}
            handleCustomFieldChange={handleCustomFieldChange}
            handleIncludeLabelsChange={handleIncludeLabelsChange}
            handleIncludeChunkChange={handleIncludeChunkChange}
            handleAlpacaFieldTypeChange={handleAlpacaFieldTypeChange}
            handleCustomInstructionChange={handleCustomInstructionChange}
            handleExport={handleExport}
            projectId={projectId}
          />
        )}

        {/* 第二个标签页：Llama Factory */}
        {currentTab === 1 && (
          <LlamaFactoryTab
            projectId={projectId}
            systemPrompt={systemPrompt}
            confirmedOnly={confirmedOnly}
            includeCOT={includeCOT}
            formatType={formatType}
            handleSystemPromptChange={handleSystemPromptChange}
            handleConfirmedOnlyChange={handleConfirmedOnlyChange}
            handleIncludeCOTChange={handleIncludeCOTChange}
          />
        )}

        {/* 第三个标签页：HuggingFace */}
        {currentTab === 2 && (
          <HuggingFaceTab
            projectId={projectId}
            systemPrompt={systemPrompt}
            confirmedOnly={confirmedOnly}
            includeCOT={includeCOT}
            formatType={formatType}
            fileFormat={fileFormat}
            customFields={customFields}
            handleSystemPromptChange={handleSystemPromptChange}
            handleConfirmedOnlyChange={handleConfirmedOnlyChange}
            handleIncludeCOTChange={handleIncludeCOTChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportDatasetDialog;
