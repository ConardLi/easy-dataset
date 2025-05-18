'use client';

import { Snackbar, Alert } from '@mui/material';

export default function MessageAlert({ message, onClose }) {
  if (!message) return null;

  const severity = message.severity || 'error';
  const text = typeof message === 'string' ? message : message.message;

  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={2000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {text}
      </Alert>
    </Snackbar>
  );
}
