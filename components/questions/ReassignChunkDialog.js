'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Autocomplete,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function ReassignChunkDialog({ open, onClose, projectId, selectedQuestionIds, onSuccess }) {
  const { t } = useTranslation();
  const [chunks, setChunks] = useState([]);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      fetchChunks();
    }
  }, [open, projectId]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/split`);
      if (response.status === 200) {
        setChunks(response.data.chunks || []);
      }
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChunk || !selectedQuestionIds || selectedQuestionIds.length === 0) return;

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/projects/${projectId}/questions/batch-reassign`, {
        questionIds: selectedQuestionIds,
        targetChunkId: selectedChunk.id
      });

      if (response.status === 200 && response.data.success) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Failed to reassign chunks:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedChunk(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('questions.reassignChunkTitle', 'Batch Reassign Chunks')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('questions.reassignInfo', 'Selected {{count}} question(s) will be reassigned to the chosen chunk.', {
              count: selectedQuestionIds?.length || 0
            })}
          </Alert>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Autocomplete
              fullWidth
              options={chunks}
              getOptionLabel={chunk => chunk.name || chunk.id}
              value={selectedChunk}
              onChange={(e, newValue) => setSelectedChunk(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label={t('questions.selectTargetChunk', 'Select target chunk')}
                  placeholder={t('questions.searchChunk', 'Search chunks...')}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.fileName} — {option.size || 0} {t('textSplit.characters', 'chars')}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel', 'Cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedChunk || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {submitting
            ? t('common.processing', 'Processing...')
            : t('questions.confirmReassign', 'Reassign')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
