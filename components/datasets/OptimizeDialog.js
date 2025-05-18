'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * AI优化对话框组件
 */
export default function OptimizeDialog({ open, onClose, onConfirm, loading }) {
  const [advice, setAdvice] = useState('');
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm(advice);
    setAdvice('');
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setAdvice('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('datasets.optimizeTitle')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t('datasets.optimizeAdvice')}
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={advice}
          onChange={e => setAdvice(e.target.value)}
          disabled={loading}
          placeholder={t('datasets.optimizePlaceholder')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" disabled={loading || !advice.trim()}>
          {loading ? <CircularProgress size={24} /> : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
