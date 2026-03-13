'use client';

import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem, Tooltip, useTheme, Typography } from '@mui/material';
import { useState } from 'react';
import TranslateIcon from '@mui/icons-material/Translate';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const languages = [
    { code: 'en', label: t('language.english', 'English'), short: 'EN' },
    { code: 'zh-CN', label: t('language.chineseSimplified', '简体中文'), short: '中文' },
    { code: 'tr', label: t('language.turkish', 'Türkçe'), short: 'TR' },
    { code: 'pt-BR', label: t('language.portugues', 'Portugues'), short: 'pt-BR' }
  ];

  const normalizedCurrentLanguage =
    i18n.language && String(i18n.language).toLowerCase().startsWith('zh') ? 'zh-CN' : i18n.language;
  const currentLanguage = languages.find(lang => lang.code === normalizedCurrentLanguage) || languages[0];

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = langCode => {
    i18n.changeLanguage(langCode);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('language.switcherTitle', 'Change Language / 切换语言 / Dil Değiştir')}>
        <IconButton
          onClick={handleClick}
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
          <Typography variant="body2" fontWeight="medium" sx={{ mr: 0.5 }}>
            {currentLanguage.short}
          </Typography>
          <TranslateIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {languages.map(lang => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={normalizedCurrentLanguage === lang.code}
          >
            <Typography variant="body2" sx={{ mr: 1, minWidth: 28 }}>
              {lang.short}
            </Typography>
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
