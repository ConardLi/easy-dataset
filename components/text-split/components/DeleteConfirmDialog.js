'use client';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function DeleteConfirmDialog({ open, fileName, onClose, onConfirm }) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        {t('common.confirmDelete')}「{fileName}」?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">{t('common.confirmDeleteDescription')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.cancel')}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
