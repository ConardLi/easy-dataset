'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ModelSettings from '@/components/settings/ModelSettings';
import { useTranslation } from 'react-i18next';

export default function GlobalModelSettingsPage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('models.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('models.globalSettingsDescription', { defaultValue: 'Manage all model configurations for this application. These settings are global and available across all projects.' })}
        </Typography>
      </Box>
      {/* We will pass a `isGlobal` prop to tell the component to use global APIs */}
      <ModelSettings isGlobal={true} />
    </Container>
  );
}
