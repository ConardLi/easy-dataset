'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper, Alert, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SettingsIcon from '@mui/icons-material/Settings';

// 导入设置组件
import BasicSettings from '@/components/settings/BasicSettings';
import ModelSettings from '@/components/settings/ModelSettings';
import TaskSettings from '@/components/settings/TaskSettings';
import PromptSettings from './components/PromptSettings';

// 定义 TAB 枚举
const TABS = {
  BASIC: 'basic',
  MODEL: 'model',
  TASK: 'task',
  PROMPTS: 'prompts'
};

export default function SettingsPage({ params }) {
  const { t } = useTranslation();
  const { projectId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(TABS.BASIC);
  const [projectExists, setProjectExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 URL hash 中获取当前 tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && Object.values(TABS).includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 检查项目是否存在
  useEffect(() => {
    async function checkProject() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setProjectExists(false);
          } else {
            throw new Error(t('projects.fetchFailed'));
          }
        } else {
          setProjectExists(true);
        }
      } catch (error) {
        console.error('获取项目详情出错:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    checkProject();
  }, [projectId, t]);

  // 处理 tab 切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // 更新 URL hash
    router.push(`/projects/${projectId}/settings?tab=${newValue}`);
  };

  if (loading) {
    return (
      <main style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: theme.palette.background.default,
        minHeight: '100vh'
      }}>
        <Container maxWidth="xl" sx={{ 
          mt: 4, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <CircularProgress />
        </Container>
      </main>
    );
  }

  if (!projectExists) {
    return (
      <main style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: theme.palette.background.default,
        minHeight: '100vh'
      }}>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Alert severity="error">{t('projects.notExist')}</Alert>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: theme.palette.background.default,
        minHeight: '100vh'
      }}>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </main>
    );
  }

  return (
    <main style={{ 
      overflow: 'hidden', 
      position: 'relative', 
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* Hero Section - 参考首页风格 */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 10 },
          pb: { xs: 6, md: 8 },
          overflow: 'hidden',
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
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            top: '-150px',
            right: '-100px',
            zIndex: 0,
            filter: 'blur(60px)'
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{
              textAlign: 'center',
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <SettingsIcon
                sx={{
                  fontSize: { xs: 40, md: 48 },
                  mr: 2,
                  color: theme.palette.primary.main,
                  filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}40)`
                }}
              />
              <Typography
                variant={isMobile ? 'h2' : 'h1'}
                component="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' },
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
                    width: '80px',
                    height: '4px',
                    background: theme.palette.gradient.primary,
                    borderRadius: '2px',
                    opacity: 0.5
                  }
                }}
              >
                {t('settings.modelConfig')}
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              component="p"
              sx={{
                maxWidth: '600px',
                mx: 'auto',
                mt: 3,
                lineHeight: 1.8,
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                fontWeight: 400,
                color: theme.palette.text.secondary,
                opacity: 0.9
              }}
            >
              {t('settings.tabsAriaLabel')}
            </Typography>
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
          {/* Tabs区域 */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: 1,
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
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              aria-label={t('settings.tabsAriaLabel')}
              sx={{
                minHeight: 48,
                '& .MuiTabs-flexContainer': {
                  gap: 1,
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: 'transparent'
                },
                '& .MuiTab-root': {
                  minHeight: 44,
                  textTransform: 'none',
                  borderRadius: '12px',
                  bgcolor: 'transparent',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  color: isDark ? theme.palette.text.secondary : '#64748B',
                  '&:hover': {
                    color: isDark ? '#FFFFFF' : theme.palette.primary.main,
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)'
                  }
                },
                '& .Mui-selected': {
                  color: '#FFFFFF !important',
                  background: theme.palette.gradient.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: isDark
                    ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                    : '0 4px 16px rgba(99, 102, 241, 0.35)',
                  '&:hover': {
                    background: theme.palette.gradient.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    opacity: 0.95,
                    boxShadow: isDark
                      ? '0 6px 20px rgba(99, 102, 241, 0.5)'
                      : '0 6px 20px rgba(99, 102, 241, 0.45)'
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab value={TABS.BASIC} label={t('settings.basicInfo')} />
              <Tab value={TABS.MODEL} label={t('settings.modelConfig')} />
              <Tab value={TABS.TASK} label={t('settings.taskConfig')} />
              <Tab value={TABS.PROMPTS} label={t('settings.promptConfig')} />
            </Tabs>
          </Paper>

          {/* 设置内容区域 */}
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
            {activeTab === TABS.BASIC && <BasicSettings projectId={projectId} />}
            {activeTab === TABS.MODEL && <ModelSettings projectId={projectId} />}
            {activeTab === TABS.TASK && <TaskSettings projectId={projectId} />}
            {activeTab === TABS.PROMPTS && <PromptSettings projectId={projectId} />}
          </Paper>
        </motion.div>
      </Container>
    </main>
  );
}
