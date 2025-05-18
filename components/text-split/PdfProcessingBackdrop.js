'use client';

import { Backdrop, Paper, CircularProgress, Typography, Box, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LoadingBackdrop({ open, title, progress = null, pageProfress = null }) {
  const { t } = useTranslation();
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
          minWidth: 400
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6">
          {title}({t(`textSplit.task.${pageProfress.taskStatus}`)})
        </Typography>
        {/** pdf文件处理进度 */}
        {progress.total > 1 ? (
          <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('textSplit.pdfProcessStatus', {
                  total: progress.total,
                  completed: progress.completed
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.percentage}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress.percentage} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        ) : (
          ''
        )}
        {/** 页面处理进度 */}
        {pageProfress.total > 1 ? (
          <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {progress.total > 1
                  ? t('textSplit.pdfPageProcessIndex', {
                      fileIndex: pageProfress.fileIndex
                    })
                  : ''}
                {t('textSplit.pdfPageProcessStatus', {
                  total: pageProfress.total,
                  completed: pageProfress.completed
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pageProfress.percentage}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={pageProfress.percentage} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        ) : (
          ''
        )}
      </Paper>
    </Backdrop>
  );
}
