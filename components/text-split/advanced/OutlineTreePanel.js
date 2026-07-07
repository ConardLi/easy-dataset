'use client';

import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * 文档大纲树面板
 * 展示 Markdown 文档的标题层级结构
 */
export default function OutlineTreePanel({ outline = [], onHeadingClick }) {
  const { t } = useTranslation();

  if (!outline || outline.length === 0) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>
        <Typography variant="body2">{t('textSplit.advancedSplitNoChunks')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, borderBottom: 1, borderColor: 'divider' }}>
        {t('textSplit.advancedSplitOutline')}
      </Typography>
      <List dense disablePadding>
        {outline.map((item, index) => (
          <ListItemButton
            key={index}
            sx={{
              pl: item.level * 2,
              py: 0.5,
              minHeight: 32,
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => onHeadingClick && onHeadingClick(item, index)}
          >
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: Math.max(11, 14 - (item.level - 1)),
                    fontWeight: item.level <= 2 ? 600 : 400,
                    color: item.level <= 2 ? 'text.primary' : 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.title}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
