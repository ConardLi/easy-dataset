'use client';

import { Box, Grid, Paper, Stack, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const CARD_SX = {
  p: 3,
  borderRadius: '20px',
  overflow: 'hidden',
  position: 'relative',
  height: '100%'
};

function MetricCard({ item, index }) {
  return (
    <Paper
      component={motion.div}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      sx={{
        ...CARD_SX,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: item.gradient,
        color: '#fff',
        boxShadow: `0 24px 48px ${item.glow || 'rgba(15,23,42,0.25)'}`
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(140deg, rgba(255,255,255,0.22) 0%, transparent 68%)',
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      />

      <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {item.icon}
          </Box>
          <Typography variant="subtitle2" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
            {item.label}
          </Typography>
        </Stack>

        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '2.5rem' } }}>
          {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.22)'
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>
            {item.caption}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function EmptyMetricsPlaceholder() {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        ...CARD_SX,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.92)' : '#fff',
        border: '1px dashed rgba(148,163,184,0.35)'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        暂无可展示的数据指标
      </Typography>
    </Paper>
  );
}

export default function MetricsGrid({ items = [] }) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={item.id || index}>
          <MetricCard index={index} item={item} />
        </Grid>
      ))}

      {!items.length && (
        <Grid item xs={12}>
          <EmptyMetricsPlaceholder />
        </Grid>
      )}
    </Grid>
  );
}

