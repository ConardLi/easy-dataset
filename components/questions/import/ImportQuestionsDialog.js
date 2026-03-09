'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileUploadStep from '@/components/datasets/import/FileUploadStep';
import QuestionFieldMappingStep from './QuestionFieldMappingStep';
import QuestionImportProgressStep from './QuestionImportProgressStep';

export default function ImportQuestionsDialog({ open, onClose, projectId, onImportSuccess }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [importData, setImportData] = useState({
    rawData: null,
    previewData: null,
    fieldMapping: {},
    chunkStrategy: 'virtual',
    sourceInfo: null
  });
  const [error, setError] = useState('');

  const steps = [
    t('import.fileUpload', 'Upload File'),
    t('import.mapFields', 'Field Mapping'),
    t('import.importing', 'Importing')
  ];

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleClose = () => {
    setCurrentStep(0);
    setImportData({
      rawData: null,
      previewData: null,
      fieldMapping: {},
      chunkStrategy: 'virtual',
      sourceInfo: null
    });
    setError('');
    onClose();
  };

  const handleDataLoaded = (data, preview, source) => {
    setImportData(prev => ({
      ...prev,
      rawData: data,
      previewData: preview,
      sourceInfo: source
    }));
    setError('');
    handleNext();
  };

  const handleFieldMappingComplete = (mapping, chunkStrategy) => {
    setImportData(prev => ({
      ...prev,
      fieldMapping: mapping,
      chunkStrategy
    }));
    handleNext();
  };

  const handleImportComplete = () => {
    handleClose();
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <FileUploadStep onDataLoaded={handleDataLoaded} onError={setError} />;
      case 1:
        return (
          <QuestionFieldMappingStep
            previewData={importData.previewData}
            onMappingComplete={handleFieldMappingComplete}
            onError={setError}
          />
        );
      case 2:
        return (
          <QuestionImportProgressStep
            projectId={projectId}
            rawData={importData.rawData}
            fieldMapping={importData.fieldMapping}
            chunkStrategy={importData.chunkStrategy}
            sourceInfo={importData.sourceInfo}
            onComplete={handleImportComplete}
            onError={setError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: 600 } }}
    >
      <DialogTitle>{t('questions.importQuestions', 'Import Questions')}</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ minHeight: 300 }}>{renderStepContent()}</Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel', 'Cancel')}</Button>
        {currentStep > 0 && currentStep < 2 && (
          <Button onClick={handleBack}>{t('common.back', 'Back')}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
