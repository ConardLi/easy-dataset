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
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
          color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
          p: 1,
          borderRadius: 1.5,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
          }
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          {i18n.language === 'zh-CN' ? 'EN' : '中'}
        </Typography>
      </IconButton>
    </Tooltip>
  );
}
