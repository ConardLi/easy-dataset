'use client';

import { Backdrop, Paper, CircularProgress, Typography, Box, LinearProgress } from '@mui/material';

export default function LoadingBackdrop({ open, title, description, progress = null }) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme => theme.zIndex.drawer + 1,
        position: 'fixed',
        backdropFilter: 'blur(3px)'
      }}
      open={open}
    >
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          minWidth: 200
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>

        {progress && progress.total > 0 && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {progress.completed}/{progress.total} ({progress.percentage}%)
              </Typography>
              {progress.questionCount > 0 && (
                <Typography variant="body2" color="text.secondary">
                  已生成问题数: {progress.questionCount}
                </Typography>
              )}
            </Box>
            <LinearProgress variant="determinate" value={progress.percentage} />
          </Box>
        )}
      </Paper>
    </Backdrop>
  );
}
