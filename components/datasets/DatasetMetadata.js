'use client';

import { Box, Typography, Chip, Tooltip, alpha, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

/**
 * 数据集元数据展示组件
 */
export default function DatasetMetadata({ currentDataset, onViewChunk }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
        {t('datasets.metadata')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip label={`${t('datasets.model')}: ${currentDataset.model}`} variant="outlined" />
        {currentDataset.questionLabel && (
          <Chip label={`${t('common.label')}: ${currentDataset.questionLabel}`} color="primary" variant="outlined" />
        )}
        <Chip
          label={`${t('datasets.createdAt')}: ${new Date(currentDataset.createAt).toLocaleString('zh-CN')}`}
          variant="outlined"
        />
        <Tooltip title={t('textSplit.viewChunk')}>
          <Chip
            label={`${t('datasets.chunkId')}: ${currentDataset.chunkName}`}
            variant="outlined"
            color="info"
            onClick={async () => {
              try {
                // 使用新API接口获取文本块内容
                const response = await fetch(
                  `/api/projects/${currentDataset.projectId}/chunks/name?chunkName=${encodeURIComponent(currentDataset.chunkName)}`
                );

                if (!response.ok) {
                  throw new Error(`获取文本块失败: ${response.statusText}`);
                }

                const chunkData = await response.json();

                // 调用父组件的方法显示文本块
                onViewChunk({
                  name: currentDataset.chunkName,
                  content: chunkData.content
                });
              } catch (error) {
                console.error('获取文本块内容失败:', error);
                // 即使API请求失败，也尝试调用查看方法
                onViewChunk({
                  name: currentDataset.chunkName,
                  content: '内容加载失败，请重试'
                });
              }
            }}
            sx={{ cursor: 'pointer' }}
          />
        </Tooltip>
        {currentDataset.confirmed && (
          <Chip
            label={t('datasets.confirmed')}
            sx={{
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.dark,
              fontWeight: 'medium'
            }}
          />
        )}
      </Box>
    </Box>
  );
}
