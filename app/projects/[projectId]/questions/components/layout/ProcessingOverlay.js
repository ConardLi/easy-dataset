'use client';

import { Box, CircularProgress, LinearProgress, Paper, Typography } from '@mui/material';

export default function ProcessingOverlay({ open, progress, title }) {
  if (!open) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 23, 0.78)',
        zIndex: theme => theme.zIndex.modal + 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 520,
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
          {title}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" sx={{ mr: 1, fontWeight: 600 }}>
              {progress?.percentage ?? 0}%
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress?.percentage ?? 0}
                sx={{ height: 8, borderRadius: 4 }}
                color="primary"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2">
              {progress?.completed ?? 0} / {progress?.total ?? 0}
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              {progress?.datasetCount ?? 0}
            </Typography>
          </Box>
        </Box>

        <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />

        <Typography variant="body2" color="text.secondary">
          正在为您蒸馏数据，请稍候...
        </Typography>
      </Paper>
    </Box>
  );
}

