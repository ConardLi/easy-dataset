'use client';

import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import 'github-markdown-css/github-markdown-light.css';

export default function ChunkViewDialog({ open, chunk, onClose }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('textSplit.chunkDetails', { chunkId: chunk?.name })}</DialogTitle>
      <DialogContent dividers>
        {chunk ? (
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{chunk.content}</ReactMarkdown>
            </div>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
