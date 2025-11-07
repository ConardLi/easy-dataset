'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, useTheme, alpha, useMediaQuery } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import Navbar from '@/components/Navbar';
import { DatasetSearchBar } from '@/components/dataset-square/DatasetSearchBar';
import { DatasetSiteList } from '@/components/dataset-square/DatasetSiteList';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function DatasetSquarePage() {
  const [projects, setProjects] = useState([]);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  // 获取项目列表和模型列表
  useEffect(() => {
    async function fetchData() {
      try {
        // 获取用户创建的项目详情
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <main style={{ 
      overflow: 'hidden', 
      position: 'relative', 
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* 导航栏 */}
      <Navbar projects={projects} />

      {/* 头部区域 - 参考首页HeroSection风格 */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 10 },
          overflow: 'hidden',
          minHeight: { xs: '60vh', md: '75vh' },
          display: 'flex',
          alignItems: 'center',
          background: isDark
            ? 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.1) 0%, transparent 50%), #0A0E27'
            : 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.05) 0%, transparent 50%), #FAFBFC'
        }}
      >
        {/* 科技风格网格背景 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isDark
              ? `linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            opacity: 0.4,
            zIndex: 0
          }}
        />

        {/* 动态光效圆圈 */}
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          sx={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            top: '-200px',
            right: '-150px',
            zIndex: 0,
            filter: 'blur(60px)'
          }}
        />

        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -80, 0],
            y: [0, -40, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          sx={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            bottom: '-150px',
            left: '-100px',
            zIndex: 0,
            filter: 'blur(60px)'
          }}
        />

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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <StorageIcon
                  sx={{
                    fontSize: { xs: 40, md: 56 },
                    mr: 2,
                    color: theme.palette.primary.main,
                    filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}40)`
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
                  {t('datasetSquare.title')}
                </Typography>
              </Box>

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
                {t('datasetSquare.subtitle')}
              </Typography>
            </Box>

            {/* 搜索栏组件 */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              sx={{
                maxWidth: 800,
                mx: 'auto',
                position: 'relative',
                zIndex: 10,
                mt: 4
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  p: 2.5,
                  borderRadius: '16px',
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
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)',
                    boxShadow: isDark
                      ? '0 12px 40px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                      : '0 8px 32px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                  },
                  overflow: 'visible'
                }}
              >
                <DatasetSearchBar />
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 内容区域 */}
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: -4, md: -6 },
          mb: { xs: 6, md: 8 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
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
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)'
            }}
          >
            <DatasetSiteList />
          </Paper>
        </motion.div>
      </Container>
    </main>
  );
}
