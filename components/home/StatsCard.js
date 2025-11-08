'use client';

import { Paper, Grid, Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import { useTranslation } from 'react-i18next';
import { MODEL_PROVIDERS } from '@/constant/model';

// 计算支持的模型数量（基于提供商的默认模型）
const getSupportedModelCount = () => {
  try {
    const set = new Set();
    MODEL_PROVIDERS.forEach(provider => {
      (provider.defaultModels || []).forEach(m => set.add(`${provider.id}:${m}`));
    });
    return set.size;
  } catch (e) {
    return 0;
  }
};

export default function StatsCard({ projects }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();

  // 统计卡片数据
  const statsItems = [
    {
      value: projects.length,
      label: t('stats.ongoingProjects'),
      color: 'primary',
      icon: <FolderOpenIcon />,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
    },
    {
      value: projects.reduce((sum, project) => sum + (project.questionsCount || 0), 0),
      label: t('stats.questionCount'),
      color: 'secondary',
      icon: <QuestionAnswerIcon />,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
    },
    {
      value: projects.reduce((sum, project) => sum + (project.datasetsCount || 0), 0),
      label: t('stats.generatedDatasets'),
      color: 'success',
      icon: <StorageIcon />,
      gradient: 'linear-gradient(135deg, #22C55E 0%, #059669 100%)'
    },
    {
      value: 2,
      label: t('stats.supportedModels'),
      color: 'warning',
      icon: <MemoryIcon />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    }
  ];

  return (
    <Box sx={{ mb: 6 }}>
      {/* 标题区域 */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        sx={{ mb: 4, textAlign: 'center' }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: theme.palette.gradient.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1
          }}
        >
          {t('stats.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
          {t('stats.subtitle')}
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {statsItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: '20px',
                background: isDark
                  ? 'rgba(15, 23, 42, 0.8)'
                  : '#FFFFFF',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isDark
                  ? '1px solid rgba(99, 102, 241, 0.2)'
                  : '1px solid rgba(226, 232, 240, 1)',
                boxShadow: isDark
                  ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                  : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                // animated gradient border
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '20px',
                  padding: '1px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.main})`,
                  WebkitMask:
                    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                  opacity: isDark ? 0.25 : 0.15
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: item.gradient,
                  opacity: 0.6,
                  transition: 'opacity 0.3s ease'
                },
                '&:hover': {
                  borderColor: isDark
                    ? `rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.4)`
                    : `rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.3)`,
                  boxShadow: isDark
                    ? `0 16px 48px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.3), 0 0 0 1px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.2)`
                    : `0 12px 40px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.15), 0 0 0 1px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.2)`,
                  '&::before': {
                    opacity: 1
                  }
                }
              }}
            >
              {/* 背景装饰 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: item.gradient,
                  opacity: isDark ? 0.1 : 0.05,
                  filter: 'blur(40px)',
                  zIndex: 0
                }}
              />

              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                {/* 图标容器 */}
                <Box
                  sx={{
                    width: { xs: 64, md: 72 },
                    height: { xs: 64, md: 72 },
                    borderRadius: '16px',
                    background: item.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: `0 8px 24px ${theme.palette[item.color].main}40`,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: -2,
                      borderRadius: '18px',
                      background: item.gradient,
                      opacity: 0.3,
                      filter: 'blur(8px)',
                      zIndex: -1
                    }
                  }}
                >
                  <Box sx={{ color: '#FFFFFF', fontSize: { xs: '28px', md: '32px' } }}>
                    {item.icon}
                  </Box>
                </Box>

                {/* 数字 */}
                <Typography
                  variant={isMobile ? 'h3' : 'h2'}
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    background: item.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2
                  }}
                >
                  {item.value}
                </Typography>

                {/* 标签 */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    opacity: 0.9
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
