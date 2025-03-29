'use client';

import { useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const useSnackbar = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  const showMessage = useCallback((newMessage, newSeverity = 'info') => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setOpen(true);
  }, []);

  const showSuccess = useCallback(
    message => {
      showMessage(message, 'success');
    },
    [showMessage]
  );

  const showError = useCallback(
    message => {
      showMessage(message, 'error');
    },
    [showMessage]
  );

  const showInfo = useCallback(
    message => {
      showMessage(message, 'info');
    },
    [showMessage]
  );

  const showWarning = useCallback(
    message => {
      showMessage(message, 'warning');
    },
    [showMessage]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const SnackbarComponent = useCallback(
    () => (
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity}>
          {message}
        </Alert>
      </Snackbar>
    ),
    [open, message, severity, handleClose]
  );

  return {
    showMessage,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    SnackbarComponent
  };
};
