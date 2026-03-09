'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { CheckCircle as CheckIcon, Error as ErrorIcon, Info as InfoIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function QuestionImportProgressStep({
  projectId,
  rawData,
  fieldMapping,
  chunkStrategy,
  sourceInfo,
  onComplete,
  onError
}) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [importStats, setImportStats] = useState({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    duplicates: 0,
    errors: []
  });
  const [completed, setCompleted] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current && rawData && fieldMapping && projectId) {
      startedRef.current = true;
      startImport();
    }
  }, [rawData, fieldMapping, projectId]);

  const startImport = async () => {
    try {
      setCurrentStep(t('import.preparingData', 'Preparing data...'));
      setImportStats(prev => ({ ...prev, total: rawData.length }));

      const convertedData = rawData.map(item => {
        const question = typeof item[fieldMapping.question] === 'string'
          ? item[fieldMapping.question].trim()
          : '';

        const converted = { question };

        if (fieldMapping.label && item[fieldMapping.label]) {
          converted.label = String(item[fieldMapping.label]).trim();
        }
        if (fieldMapping.chunkName && item[fieldMapping.chunkName]) {
          converted.chunkName = String(item[fieldMapping.chunkName]).trim();
        }
        if (fieldMapping.context && item[fieldMapping.context]) {
          converted.context = String(item[fieldMapping.context]).trim();
        }

        return converted;
      });

      setProgress(20);
      setCurrentStep(t('import.uploadingData', 'Uploading data...'));

      const batchSize = 500;
      let processed = 0;
      let success = 0;
      let failed = 0;
      let skipped = 0;
      let duplicates = 0;
      const errors = [];

      for (let i = 0; i < convertedData.length; i += batchSize) {
        const batch = convertedData.slice(i, i + batchSize);

        try {
          const response = await fetch(`/api/projects/${projectId}/questions/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questions: batch,
              chunkStrategy,
              sourceInfo
            })
          });

          if (!response.ok) {
            throw new Error(`Batch upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          success += result.success || 0;
          failed += result.failed || 0;
          skipped += result.skipped || 0;
          duplicates += result.duplicates || 0;
          processed += batch.length;

          if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          failed += batch.length;
          processed += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        }

        const progressPercent = 20 + (processed / convertedData.length) * 75;
        setProgress(progressPercent);
        setImportStats({
          total: convertedData.length,
          processed,
          success,
          failed,
          skipped,
          duplicates,
          errors
        });

        setCurrentStep(
          t('import.processing', 'Processing... {{processed}}/{{total}}', {
            processed,
            total: convertedData.length
          })
        );
      }

      setProgress(100);
      setCurrentStep(t('import.completed', 'Import completed'));
      setCompleted(true);

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      onError(error.message);
      setImportStats(prev => ({
        ...prev,
        errors: [...prev.errors, error.message]
      }));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('questions.importingQuestions', 'Importing Questions')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          {currentStep}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}% {t('import.complete', 'complete')}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('import.importStats', 'Import Statistics')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<InfoIcon />}
            label={t('import.total', 'Total: {{count}}', { count: importStats.total })}
            variant="outlined"
          />
          <Chip
            icon={<CheckIcon />}
            label={t('import.success', 'Success: {{count}}', { count: importStats.success })}
            color="success"
            variant="outlined"
          />
          {importStats.duplicates > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={t('questions.importDuplicates', 'Duplicates: {{count}}', { count: importStats.duplicates })}
              color="info"
              variant="outlined"
            />
          )}
          {importStats.skipped > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={t('import.skipped', 'Skipped: {{count}}', { count: importStats.skipped })}
              color="warning"
              variant="outlined"
            />
          )}
          {importStats.failed > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={t('import.failed', 'Failed: {{count}}', { count: importStats.failed })}
              color="error"
              variant="outlined"
            />
          )}
        </Box>

        {sourceInfo && (
          <Typography variant="body2" color="text.secondary">
            {t('import.source', 'Source')}: {sourceInfo.fileName || sourceInfo.type}
          </Typography>
        )}
      </Paper>

      {importStats.errors.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom color="error">
            {t('import.errors', 'Errors')}
          </Typography>
          <List dense>
            {importStats.errors.slice(0, 10).map((error, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <ErrorIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={error} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            ))}
          </List>
          {importStats.errors.length > 10 && (
            <Typography variant="body2" color="text.secondary">
              {t('import.moreErrors', '... and {{count}} more errors', {
                count: importStats.errors.length - 10
              })}
            </Typography>
          )}
        </Paper>
      )}

      {completed && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {t('questions.importSuccess', 'Import complete! Successfully imported {{success}} questions.', {
            success: importStats.success
          })}
        </Alert>
      )}
    </Box>
  );
}
