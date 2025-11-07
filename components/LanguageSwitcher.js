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
            ? 'rgba(99, 102, 241, 0.1)' 
            : 'rgba(99, 102, 241, 0.08)',
          color: theme.palette.mode === 'dark' 
            ? theme.palette.text.primary 
            : theme.palette.primary.main,
          p: 1,
          borderRadius: 1.5,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
          fontWeight: 600,
          minWidth: 40,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(99, 102, 241, 0.2)' 
              : 'rgba(99, 102, 241, 0.12)',
            borderColor: theme.palette.primary.main,
            boxShadow: `0 2px 8px rgba(99, 102, 241, 0.2)`,
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <Typography 
          variant="body2" 
          fontWeight={700}
          sx={{
            fontSize: '0.75rem',
            letterSpacing: '0.5px'
          }}
        >
          {i18n.language === 'zh-CN' ? 'EN' : '中'}
        </Typography>
      </IconButton>
    </Tooltip>
  );
}
