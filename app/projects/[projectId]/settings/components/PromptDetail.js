import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Box, Typography, Chip, Button, Paper } from '@mui/material';
import { Edit as EditIcon, Restore as RestoreIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import 'github-markdown-css/github-markdown-light.css';

/**
 * 右侧提示词详情展示组件
 */
const PromptDetail = ({
  currentPromptConfig,
  selectedPrompt,
  promptContent,
  isCustomized,
  onEditClick,
  onDeleteClick
}) => {
  const { t } = useTranslation();

  if (!currentPromptConfig) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>{t('settings.prompts.selectPromptFirst')}</Box>
    );
  }

  const handleEditClick = () => {
    onEditClick();
  };

  const handleDeleteClick = () => {
    onDeleteClick();
  };

  return (
    <Card>
      <CardContent>
        {/* 标题、描述与操作区域 */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">{currentPromptConfig.name}</Typography>
              {isCustomized(selectedPrompt) && (
                <Chip label={t('settings.prompts.customized')} color="primary" size="small" />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Button startIcon={<EditIcon />} variant="contained" size="small" onClick={handleEditClick}>
                {t('settings.prompts.editPrompt')}
              </Button>

              {isCustomized(selectedPrompt) && (
                <Button startIcon={<RestoreIcon />} color="error" size="small" onClick={handleDeleteClick}>
                  {t('settings.prompts.restoreDefault')}
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {currentPromptConfig.description}
          </Typography>
        </Box>

        {/* Markdown 渲染提示词内容 */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            overflow: 'auto'
          }}
        >
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptContent}</ReactMarkdown>
          </div>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default PromptDetail;
