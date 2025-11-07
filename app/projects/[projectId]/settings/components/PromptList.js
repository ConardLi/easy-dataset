import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tabs, Tab, Typography, Chip, useTheme } from '@mui/material';
import { shouldShowPrompt } from './promptUtils';

/**
 * 左侧提示词列表组件
 */
const PromptList = ({
  currentCategory,
  currentCategoryConfig,
  selectedPrompt,
  currentLanguage,
  isCustomized,
  onPromptSelect
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!currentCategoryConfig?.prompts) {
    return (
      <Typography 
        variant="body2" 
        sx={{ 
          color: isDark ? '#CBD5E1' : '#64748B',
          textAlign: 'center'
        }}
      >
        {t('settings.prompts.noPromptsAvailable')}
      </Typography>
    );
  }

  return (
    <Tabs
      orientation="vertical"
      value={selectedPrompt || ''}
      onChange={(e, newValue) => onPromptSelect(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        borderRight: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`,
        '& .MuiTabs-indicator': {
          left: 0,
          right: 'auto',
          width: '3px',
          bgcolor: theme.palette.primary.main
        },
        '& .MuiTab-root': {
          alignItems: 'flex-start',
          textAlign: 'left',
          color: isDark ? '#CBD5E1' : '#64748B',
          fontWeight: 500,
          fontSize: '0.9375rem',
          minHeight: 60,
          px: 2,
          borderRadius: '8px',
          mb: 0.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
            color: isDark ? '#FFFFFF' : theme.palette.primary.main
          }
        },
        '& .Mui-selected': {
          color: '#FFFFFF !important',
          bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          fontWeight: 600,
          boxShadow: isDark
            ? '0 2px 8px rgba(99, 102, 241, 0.4)'
            : '0 2px 8px rgba(99, 102, 241, 0.3)',
          '&:hover': {
            bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            opacity: 0.95
          }
        }
      }}
    >
      {currentCategoryConfig &&
        Object.entries(currentCategoryConfig.prompts).map(([promptKey, promptConfig]) => {
          if (!shouldShowPrompt(promptKey, currentLanguage)) return null;

          const customized = isCustomized(promptKey);

          return (
            <Tab
              key={promptKey}
              value={promptKey}
              label={
                <Box sx={{ textAlign: 'left', width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {promptConfig.name}
                  </Typography>
                  {customized && (
                    <Chip label={t('settings.prompts.customized')} color="primary" size="small" sx={{ mt: 0.5 }} />
                  )}
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                minHeight: 60,
                px: 2,
                justifyContent: 'flex-start',
                width: '100%'
              }}
            />
          );
        })}
    </Tabs>
  );
};

export default PromptList;
