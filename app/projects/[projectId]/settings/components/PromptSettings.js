import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Grid, Card, CardContent } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import fetchWithRetry from '@/lib/util/request';
import { useSnackbar } from '@/hooks/useSnackbar';

export default function PromptSettings({ projectId }) {
  const { t } = useTranslation();
  const { showSuccess, showError, SnackbarComponent } = useSnackbar();
  const [prompts, setPrompts] = useState({
    globalPrompt: '',
    questionPrompt: '',
    answerPrompt: '',
    labelPrompt: '',
    domainTreePrompt: ''
  });
  const [loading, setLoading] = useState(false);

  // 加载提示词配置
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await fetchWithRetry(`/api/projects/${projectId}/config`);
        const config = await response.json();
        // 提取提示词相关的字段
        const promptFields = {
          globalPrompt: config.globalPrompt || '',
          questionPrompt: config.questionPrompt || '',
          answerPrompt: config.answerPrompt || '',
          labelPrompt: config.labelPrompt || '',
          domainTreePrompt: config.domainTreePrompt || ''
        };
        setPrompts(promptFields);
      } catch (error) {
        console.error('加载提示词配置失败:', error);
        showError(t('settings.loadPromptsFailed'));
      }
    };
    loadPrompts();
  }, [projectId]);

  // 保存提示词配置
  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetchWithRetry(`/api/projects/${projectId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompts: { ...prompts } })
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(t('settings.savePromptsSuccess'));
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存提示词配置失败:', error);
      showError(t('settings.savePromptsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = field => event => {
    setPrompts(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        {t('settings.promptsDescription')}
      </Alert>
      <SnackbarComponent />
      <Grid container spacing={3}>
        {/* 全局提示词 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('settings.globalPrompt')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={prompts.globalPrompt}
                onChange={handleChange('globalPrompt')}
                placeholder={t('settings.globalPromptPlaceholder')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 生成问题提示词 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('settings.questionPrompt')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={prompts.questionPrompt}
                onChange={handleChange('questionPrompt')}
                placeholder={t('settings.questionPromptPlaceholder')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 生成答案提示词 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('settings.answerPrompt')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={prompts.answerPrompt}
                onChange={handleChange('answerPrompt')}
                placeholder={t('settings.answerPromptPlaceholder')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 问题打标提示词 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('settings.labelPrompt')}
              </Typography>
              <TextField
                disabled
                fullWidth
                multiline
                rows={3}
                size="small"
                value={prompts.labelPrompt}
                onChange={handleChange('labelPrompt')}
                placeholder={t('settings.labelPromptPlaceholder')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 构建领域树提示词 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('settings.domainTreePrompt')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={prompts.domainTreePrompt}
                onChange={handleChange('domainTreePrompt')}
                placeholder={t('settings.domainTreePromptPlaceholder')}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={<SaveIcon />}>
          {t('common.save')}
        </Button>
      </Box>
    </Box>
  );
}
