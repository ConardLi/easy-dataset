'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * 批量编辑文本块对话框
 * @param {Object} props
 * @param {boolean} props.open - 对话框是否打开
 * @param {Function} props.onClose - 关闭对话框的回调
 * @param {Function} props.onConfirm - 确认编辑的回调
 * @param {Array} props.selectedChunks - 选中的文本块ID数组
 * @param {number} props.totalChunks - 文本块总数
 * @param {boolean} props.loading - 是否正在处理
 */
export default function BatchEditChunksDialog({
  open,
  onClose,
  onConfirm,
  selectedChunks = [],
  totalChunks = 0,
  loading = false
}) {
  const { t } = useTranslation();
  const [position, setPosition] = useState('start'); // 'start' 或 'end'
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // 处理位置变更
  const handlePositionChange = event => {
    setPosition(event.target.value);
  };

  // 处理内容变更
  const handleContentChange = event => {
    setContent(event.target.value);
    if (error) setError('');
  };

  // 处理确认
  const handleConfirm = () => {
    if (!content.trim()) {
      setError(t('batchEdit.contentRequired'));
      return;
    }

    onConfirm({
      position,
      content: content.trim(),
      chunkIds: selectedChunks
    });
  };

  // 处理关闭
  const handleClose = () => {
    if (!loading) {
      setContent('');
      setError('');
      setPosition('start');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEscapeKeyDown={loading}>
      <DialogTitle>{t('batchEdit.title')}</DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* 选择提示 */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {selectedChunks.length === totalChunks
                ? t('batchEdit.allChunksSelected', { count: totalChunks })
                : t('batchEdit.selectedChunks', {
                    selected: selectedChunks.length,
                    total: totalChunks
                  })}
            </Typography>
          </Alert>

          {/* 位置选择 */}
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              {t('batchEdit.position')}
            </FormLabel>
            <RadioGroup value={position} onChange={handlePositionChange} row>
              <FormControlLabel value="start" control={<Radio />} label={t('batchEdit.atBeginning')} />
              <FormControlLabel value="end" control={<Radio />} label={t('batchEdit.atEnd')} />
            </RadioGroup>
          </FormControl>

          {/* 内容输入 */}
          <TextField
            fullWidth
            label={t('batchEdit.contentToAdd')}
            multiline
            rows={6}
            value={content}
            onChange={handleContentChange}
            placeholder={t('batchEdit.contentPlaceholder')}
            error={!!error}
            helperText={error || t('batchEdit.contentHelp')}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          {/* 预览示例 */}
          {content.trim() && (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
                mb: 2
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('batchEdit.preview')}:
              </Typography>
              <Box
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  color: 'text.secondary'
                }}
              >
                {position === 'start' ? (
                  <>
                    <span style={{ backgroundColor: '#e3f2fd', padding: '2px 4px' }}>{content}</span>
                    {'\n\n[原始文本块内容...]'}
                  </>
                ) : (
                  <>
                    {'[原始文本块内容...]\n\n'}
                    <span style={{ backgroundColor: '#e3f2fd', padding: '2px 4px' }}>{content}</span>
                  </>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !content.trim() || selectedChunks.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('batchEdit.processing') : t('batchEdit.applyToChunks', { count: selectedChunks.length })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
