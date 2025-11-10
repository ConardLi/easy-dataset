'use client';

import { Box, Container, Typography, Button, Chip, Stack, useMediaQuery } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function HeroSection({ onCreateProject }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        position: 'relative',
        pt: { xs: 8, md: 12 },
        pb: { xs: 8, md: 10 },
        overflow: 'hidden',
        minHeight: { xs: '70vh', md: '85vh' },
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: '900px',
            mx: 'auto',
            position: 'relative'
          }}
        >
          {/* 主标题区域 */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{ mb: 4 }}
          >
            {/* 顶部标签 */}
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: '16px !important' }} />}
              label={t('home.badge')}
              sx={{
                mb: 3,
                px: 2,
                py: 0.5,
                height: 'auto',
                background: isDark
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'rgba(99, 102, 241, 0.1)',
                border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.875rem',
                '& .MuiChip-icon': {
                  color: theme.palette.primary.main
                }
              }}
            />

            <Typography
              variant={isMobile ? 'h2' : 'h1'}
              component="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem', lg: '4.5rem' },
                fontWeight: 800,
                letterSpacing: { xs: '-0.02em', md: '-0.03em' },
                lineHeight: 1.1,
                mb: 3,
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '4px',
                  background: theme.palette.gradient.primary,
                  borderRadius: '2px',
                  opacity: 0.5
                }
              }}
            >
              {t('home.title')}
            </Typography>

            <Typography
              variant={isMobile ? 'body1' : 'h5'}
              component="p"
              sx={{
                maxWidth: '700px',
                mx: 'auto',
                mt: 4,
                mb: 2,
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
                color: theme.palette.text.secondary,
                opacity: 0.9
              }}
            >
              {t('home.subtitle')}
            </Typography>
          </Box>

          {/* 功能特性标签 */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            sx={{ mb: 5 }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              sx={{ flexWrap: 'wrap', gap: 1.5 }}
            >
              {[
                { label: t('home.features.smartChunking'), color: 'primary' },
                { label: t('home.features.autoQA'), color: 'secondary' },
                { label: t('home.features.oneClickExport'), color: 'success' }
              ].map((item, idx) => (
                <Chip
                  key={idx}
                  label={item.label}
                  sx={{
                    px: 2,
                    py: 1,
                    height: 'auto',
                    background: isDark
                      ? `rgba(${idx === 0 ? '99, 102, 241' : idx === 1 ? '139, 92, 246' : '6, 182, 212'}, 0.1)`
                      : `rgba(${idx === 0 ? '99, 102, 241' : idx === 1 ? '139, 92, 246' : '6, 182, 212'}, 0.08)`,
                    border: `1px solid ${isDark ? `rgba(${idx === 0 ? '99, 102, 241' : idx === 1 ? '139, 92, 246' : '6, 182, 212'}, 0.3)` : `rgba(${idx === 0 ? '99, 102, 241' : idx === 1 ? '139, 92, 246' : '6, 182, 212'}, 0.2)`}`,
                    color: theme.palette[item.color].main,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${theme.palette[item.color].main}30`,
                      borderColor: theme.palette[item.color].main
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* 主要操作按钮 */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              gap: 2,
              mb: 4
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={onCreateProject}
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                px: 4,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '14px',
                background: theme.palette.gradient.primary,
                color: '#FFFFFF',
                boxShadow: isDark
                  ? '0 8px 24px rgba(99, 102, 241, 0.4)'
                  : '0 8px 24px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: isDark
                    ? '0 12px 32px rgba(99, 102, 241, 0.5)'
                    : '0 12px 32px rgba(99, 102, 241, 0.4)',
                  '&::before': {
                    left: '100%'
                  }
                },
                '&:active': {
                  transform: 'translateY(-2px) scale(1)'
                }
              }}
            >
              {t('home.createProject')}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
