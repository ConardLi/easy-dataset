'use client';

import { Paper, Grid, Box, Typography, useMediaQuery, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function DatasetStats({ projectId, datasets, loading }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    avgScore: 0,
    highQuality: 0
  });

  useEffect(() => {
    if (datasets && datasets.data) {
      const total = datasets.total || 0;
      const confirmedCount = datasets.data.filter(d => d.confirmed).length;
      const scores = datasets.data.map(d => d.score || 0);
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      const highQuality = datasets.data.filter(d => (d.score || 0) >= 4).length;
      
      setStats({
        total,
        confirmed: confirmedCount,
        avgScore: avgScore.toFixed(1),
        highQuality
      });
    }
  }, [datasets]);

  // 统计卡片数据
  const statsItems = [
    {
      value: stats.total,
      label: t('datasets.stats.totalDatasets', '数据集总数'),
      color: 'primary',
      icon: <StorageIcon />,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      glowColor: '99, 102, 241'
    },
    {
      value: stats.confirmed,
      label: t('datasets.stats.confirmedDatasets', '已确认数据'),
      color: 'success',
      icon: <CheckCircleIcon />,
      gradient: 'linear-gradient(135deg, #22C55E 0%, #059669 100%)',
      glowColor: '34, 197, 94'
    },
    {
      value: stats.avgScore,
      label: t('datasets.stats.avgScore', '平均评分'),
      color: 'warning',
      icon: <StarIcon />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      glowColor: '245, 158, 11'
    },
    {
      value: stats.highQuality,
      label: t('datasets.stats.highQuality', '高质量数据'),
      color: 'secondary',
      icon: <TrendingUpIcon />,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      glowColor: '6, 182, 212'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Skeleton 
              variant="rectangular" 
              height={140} 
              sx={{ 
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(226, 232, 240, 0.3)'
              }} 
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
      {statsItems.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ 
              y: -6, 
              scale: 1.02,
              transition: { duration: 0.2 } 
            }}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: '16px',
              background: isDark
                ? 'rgba(15, 23, 42, 0.9)'
                : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? `1px solid rgba(${item.glowColor}, 0.2)`
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(${item.glowColor}, 0.15)`
                : '0 2px 12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: item.gradient,
                opacity: 0.8,
                transition: 'height 0.3s ease, opacity 0.3s ease'
              },
              '&:hover': {
                borderColor: isDark
                  ? `rgba(${item.glowColor}, 0.4)`
                  : `rgba(${item.glowColor}, 0.3)`,
                boxShadow: isDark
                  ? `0 12px 40px rgba(${item.glowColor}, 0.25), 0 0 0 1px rgba(${item.glowColor}, 0.3)`
                  : `0 8px 32px rgba(${item.glowColor}, 0.12), 0 0 0 1px rgba(${item.glowColor}, 0.2)`,
                '&::before': {
                  height: '100%',
                  opacity: 0.05
                }
              }
            }}
          >
            {/* 背景光晕装饰 */}
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: item.gradient,
                opacity: isDark ? 0.08 : 0.04,
                filter: 'blur(50px)',
                zIndex: 0,
                transition: 'all 0.3s ease'
              }}
            />

            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              {/* 图标容器 */}
              <Box
                sx={{
                  width: { xs: 56, md: 64 },
                  height: { xs: 56, md: 64 },
                  borderRadius: '14px',
                  background: item.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isDark
                    ? `0 6px 20px rgba(${item.glowColor}, 0.35)`
                    : `0 4px 16px rgba(${item.glowColor}, 0.25)`,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '16px',
                    background: item.gradient,
                    opacity: 0.25,
                    filter: 'blur(10px)',
                    zIndex: -1,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    transform: 'scale(1.05)',
                    '&::after': {
                      opacity: 0.4
                    }
                  }
                }}
              >
                <Box 
                  sx={{ 
                    color: '#FFFFFF', 
                    fontSize: { xs: '26px', md: '30px' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </Box>
              </Box>

              {/* 文本内容 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* 数字 */}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 0.5,
                    background: item.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: { xs: '1.75rem', md: '2rem' },
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {item.value}
                </Typography>

                {/* 标签 */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', md: '0.8125rem' },
                    opacity: 0.85,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

