'use client';

import { Box, Button, Divider, Typography, IconButton, CircularProgress, Paper, Tooltip } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

/**
 * 数据集详情页面的头部导航组件
 */
export default function DatasetHeader({
  projectId,
  datasetsAllCount,
  datasetsConfirmCount,
  confirming,
  currentDataset,
  shortcutsEnabled,
  setShortcutsEnabled,
  onNavigate,
  onConfirm,
  onDelete
}) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<NavigateBeforeIcon />} onClick={() => router.push(`/projects/${projectId}/datasets`)}>
            {t('common.backToList')}
          </Button>
          <Divider orientation="vertical" flexItem />
          <Typography variant="h6">{t('datasets.datasetDetail')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('datasets.stats', {
              total: datasetsAllCount,
              confirmed: datasetsConfirmCount,
              percentage: ((datasetsConfirmCount / datasetsAllCount) * 100).toFixed(2)
            })}
          </Typography>
        </Box>
        {/* 快捷键启用选项 - 已注释掉，保持原代码结构 */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">{t('datasets.enableShortcuts')}</Typography>
          <Tooltip title={t('datasets.shortcutsHelp')}>
            <IconButton size="small" color="info">
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>?</Typography>
            </IconButton>
          </Tooltip>
          <Button
            variant={shortcutsEnabled ? 'contained' : 'outlined'}
            onClick={() => setShortcutsEnabled((prev) => !prev)}
          >
            {shortcutsEnabled ? t('common.enabled') : t('common.disabled')}
          </Button>
        </Box> */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => onNavigate('prev')}>
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton onClick={() => onNavigate('next')}>
            <NavigateNextIcon />
          </IconButton>
          <Divider orientation="vertical" flexItem />
          <Button
            variant="contained"
            color="primary"
            disabled={confirming || currentDataset.confirmed}
            onClick={onConfirm}
            sx={{ mr: 1 }}
          >
            {confirming ? (
              <CircularProgress size={24} />
            ) : currentDataset.confirmed ? (
              t('datasets.confirmed')
            ) : (
              t('datasets.confirmSave')
            )}
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onDelete}>
            {t('common.delete')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
