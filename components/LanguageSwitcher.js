'use client';

import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip, useTheme, Typography } from '@mui/material';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const theme = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  return (
    <Tooltip title={i18n.language === 'zh-CN' ? 'Switch to English' : '切换到中文'}>
      <IconButton
        onClick={toggleLanguage}
        size="small"
        sx={{
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(99, 102, 241, 0.08)' 
            : '#FFFFFF',
          color: theme.palette.mode === 'dark' 
            ? theme.palette.text.primary 
            : '#1E293B',
          p: 1.25,
          borderRadius: '12px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
          fontWeight: 600,
          minWidth: 40,
          width: '40px',
          height: '40px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(99, 102, 241, 0.15)' 
              : '#F8F9FA',
            borderColor: theme.palette.primary.main,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 16px rgba(99, 102, 241, 0.35), 0 0 0 3px rgba(99, 102, 241, 0.1)'
              : '0 4px 16px rgba(99, 102, 241, 0.25), 0 0 0 3px rgba(99, 102, 241, 0.1)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Typography 
          variant="body2" 
          fontWeight={700}
          sx={{
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
            color: 'inherit'
          }}
        >
          {i18n.language === 'zh-CN' ? 'EN' : '中'}
        </Typography>
      </IconButton>
    </Tooltip>
  );
}
