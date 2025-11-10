'use client';

import { Box, Chip, Container, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const HERO_SX = {
  position: 'relative',
  overflow: 'hidden',
  pt: { xs: 6, md: 8 },
  pb: { xs: 5, md: 8 }
};

const heroBackground = isDark =>
  isDark
    ? 'radial-gradient(circle at top, rgba(99,102,241,0.22) 0%, transparent 48%), linear-gradient(160deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.92) 45%, rgba(17,24,39,0.88) 100%)'
    : 'radial-gradient(circle at top, rgba(99,102,241,0.18) 0%, transparent 55%), linear-gradient(160deg, rgba(248,250,255,1) 0%, rgba(240,244,255,0.95) 44%, rgba(228,233,255,0.92) 100%)';

export default function HeroSection({ title, description, chips = [], icon }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ ...HERO_SX, background: heroBackground(isDark) }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1 }}
        sx={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: { xs: 260, md: 360 },
          height: { xs: 260, md: 360 },
          background: isDark
            ? 'radial-gradient(circle at 30% 40%, rgba(99,102,241,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.45), transparent 60%)'
            : 'radial-gradient(circle at 30% 40%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.28), transparent 60%)',
          filter: 'blur(46px)',
          opacity: 0.9
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: isDark
            ? `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`
            : `linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)`,
          backgroundSize: '54px 54px',
          opacity: 0.3
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={3} alignItems="flex-start" component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {icon}
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{
                fontSize: { xs: '1.9rem', md: '2.9rem' },
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              fontSize: { xs: '1rem', md: '1.08rem' },
              lineHeight: 1.75,
              color: isDark ? 'rgba(214, 219, 255, 0.78)' : 'rgba(15, 23, 42, 0.75)'
            }}
          >
            {description}
          </Typography>

          {!!chips.length && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              {chips.map((chip, index) => (
                <Tooltip title={chip.tooltip} arrow key={chip.label + index}>
                  <Chip
                    label={chip.label}
                    sx={{
                      px: 1.6,
                      py: 0.5,
                      fontWeight: 600,
                      borderRadius: '999px',
                      border: chip.border || '1px solid rgba(99,102,241,0.32)',
                      bgcolor: chip.background || (isDark ? 'rgba(99,102,241,0.16)' : 'rgba(99,102,241,0.12)'),
                      color: chip.color || (isDark ? '#E0E7FF' : theme.palette.primary.dark),
                      textTransform: 'none'
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

