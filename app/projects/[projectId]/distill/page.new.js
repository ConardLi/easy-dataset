'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';
import { Box, Typography, Paper, Container, Button, CircularProgress, Alert, IconButton, Tooltip, Chip, useTheme, Grid, Stack, Divider, alpha, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ScienceIcon from '@mui/icons-material/Science';
import DistillTreeView from '@/components/distill/DistillTreeView';
import TagGenerationDialog from '@/components/distill/TagGenerationDialog';
import QuestionGenerationDialog from '@/components/distill/QuestionGenerationDialog';
import AutoDistillDialog from '@/components/distill/AutoDistillDialog';
import AutoDistillProgress from '@/components/distill/AutoDistillProgress';
import ParticleBackground from '@/components/home/ParticleBackground';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { motion } from 'framer-motion';
import { autoDistillService } from './autoDistillService';
import axios from 'axios';
import { toast } from 'sonner';

export default function DistillPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();
  const selectedModel = useAtomValue(selectedModelInfoAtom);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);

  // 标签生成对话框相关状态
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedTagPath, setSelectedTagPath] = useState('');

  // 自动蒸馏相关状态
  const [autoDistillDialogOpen, setAutoDistillDialogOpen] = useState(false);
  const [autoDistillProgressOpen, setAutoDistillProgressOpen] = useState(false);
  const [autoDistillRunning, setAutoDistillRunning] = useState(false);
  const [distillStats, setDistillStats] = useState({
    tagsCount: 0,
    questionsCount: 0,
    datasetsCount: 0,
    multiTurnDatasetsCount: 0
  });
  const [distillProgress, setDistillProgress] = useState({
    stage: 'initializing',
    tagsTotal: 0,
    tagsBuilt: 0,
    questionsTotal: 0,
    questionsBuilt: 0,
    datasetsTotal: 0,
    datasetsBuilt: 0,
    multiTurnDatasetsTotal: 0,
    multiTurnDatasetsBuilt: 0,
    logs: []
  });

  const treeViewRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const actionDisabled = !selectedModel || Object.keys(selectedModel).length === 0;

  const statCards = [
    {
      label: t('distill.stats.tags', '标签层级'),
      value: distillStats.tagsCount,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      glowColor: '99, 102, 241',
      icon: <CategoryOutlinedIcon />
    },
    {
      label: t('distill.stats.questions', '生成问题'),
      value: distillStats.questionsCount,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      glowColor: '6, 182, 212',
      icon: <QuizOutlinedIcon />
    },
    {
      label: t('distill.stats.datasets', '单轮数据集'),
      value: distillStats.datasetsCount,
      gradient: 'linear-gradient(135deg, #22C55E 0%, #059669 100%)',
      glowColor: '34, 197, 94',
      icon: <DataObjectOutlinedIcon />
    },
    {
      label: t('distill.stats.multiTurn', '多轮对话'),
      value: distillStats.multiTurnDatasetsCount,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      glowColor: '245, 158, 11',
      icon: <ForumOutlinedIcon />
    }
  ];

  const quickTips = [
    t('distill.tips.selectModel', '先在右上角选择模型，解锁智能生成能力。'),
    t('distill.tips.tagHierarchy', '通过层级化标签构建知识体系，再生成高质量问答。'),
    t('distill.tips.autoDistill', '使用全自动蒸馏快速批量生成问题与数据集，可随时查看进度。')
  ];

  const recentLogs = distillProgress.logs.slice(-4).reverse();
  const selectedModelName = selectedModel?.modelName || selectedModel?.modelId || t('distill.noModelSelected', '未选择模型');

  // 获取项目信息和标签列表
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTags();
      fetchDistillStats();
    }
  }, [projectId]);

  // 监听多轮对话数据集刷新事件
  useEffect(() => {
    const handleRefreshStats = () => {
      fetchDistillStats();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('refreshDistillStats', handleRefreshStats);

      return () => {
        window.removeEventListener('refreshDistillStats', handleRefreshStats);
      };
    }
  }, [projectId]);

  // 获取项目信息
  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('获取项目信息失败:', error);
      setError(t('common.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // 获取标签列表
  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}/distill/tags/all`);
      setTags(response.data);
    } catch (error) {
      console.error('获取标签列表失败:', error);
      setError(t('common.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // 获取蒸馏统计信息
  const fetchDistillStats = async () => {
    try {
      // 获取标签数量
      const tagsResponse = await axios.get(`/api/projects/${projectId}/distill/tags/all`);
      const tagsCount = tagsResponse.data.length;

      // 获取问题数量
      const questionsResponse = await axios.get(`/api/projects/${projectId}/questions/tree?isDistill=true`);
      const questionsCount = questionsResponse.data.length;

      // 获取数据集数量
      const datasetsCount = questionsResponse.data.filter(q => q.answered).length;

      // 获取多轮对话数据集数量
      let multiTurnDatasetsCount = 0;
      try {
        const conversationsResponse = await axios.get(
          `/api/projects/${projectId}/dataset-conversations?getAllIds=true`
        );
        multiTurnDatasetsCount = (conversationsResponse.data.allConversationIds || []).length;
      } catch (error) {
        console.log('获取多轮对话数据集统计失败，可能是API不存在:', error.message);
      }

      setDistillStats({
        tagsCount,
        questionsCount,
        datasetsCount,
        multiTurnDatasetsCount
      });
    } catch (error) {
      console.error('获取蒸馏统计信息失败:', error);
    }
  };

  // 打开生成标签对话框
  const handleOpenTagDialog = (tag = null, tagPath = '') => {
    if (!selectedModel || Object.keys(selectedModel).length === 0) {
      setError(t('distill.selectModelFirst'));
      return;
    }
    setSelectedTag(tag);
    setSelectedTagPath(tagPath);
    setTagDialogOpen(true);
  };

  // 打开生成问题对话框
  const handleOpenQuestionDialog = (tag, tagPath) => {
    if (!selectedModel || Object.keys(selectedModel).length === 0) {
      setError(t('distill.selectModelFirst'));
      return;
    }
    setSelectedTag(tag);
    setSelectedTagPath(tagPath);
    setQuestionDialogOpen(true);
  };

  // 处理标签生成完成
  const handleTagGenerated = () => {
    fetchTags();
    setTagDialogOpen(false);
  };

  // 处理问题生成完成
  const handleQuestionGenerated = () => {
    setQuestionDialogOpen(false);
    fetchTags();
    fetchDistillStats();
    if (treeViewRef.current && typeof treeViewRef.current.fetchQuestionsStats === 'function') {
      treeViewRef.current.fetchQuestionsStats();
    }
  };

  // 打开自动蒸馏对话框
  const handleOpenAutoDistillDialog = () => {
    if (!selectedModel || Object.keys(selectedModel).length === 0) {
      setError(t('distill.selectModelFirst'));
      return;
    }
    setAutoDistillDialogOpen(true);
  };

  // 开始自动蒸馏任务（前台运行）
  const handleStartAutoDistill = async (config) => {
    // 重置进度
    setDistillProgress({
      stage: 'initializing',
      tagsTotal: 0,
      tagsBuilt: 0,
      questionsTotal: 0,
      questionsBuilt: 0,
      datasetsTotal: 0,
      datasetsBuilt: 0,
      multiTurnDatasetsTotal: 0,
      multiTurnDatasetsBuilt: 0,
      logs: []
    });

    setAutoDistillDialogOpen(false);
    setAutoDistillProgressOpen(true);
    setAutoDistillRunning(true);

    try {
      await autoDistillService.runAutoDistill(
        projectId,
        selectedModel,
        config,
        updateProgress,
        addLog
      );

      setAutoDistillRunning(false);
      toast.success(t('distill.autoDistillComplete'));
    } catch (error) {
      setAutoDistillRunning(false);
      toast.error(error.message || t('distill.autoDistillFailed'));
      addLog(`❌ ${t('distill.autoDistillFailed')}: ${error.message}`);
    }
  };

  // 更新进度
  const updateProgress = (progressUpdate) => {
    setDistillProgress(prev => {
      const newProgress = { ...prev };
      
      // 更新阶段
      if (progressUpdate.stage) {
        newProgress.stage = progressUpdate.stage;
      }

      // 更新标签总数
      if (progressUpdate.tagsTotal) {
        newProgress.tagsTotal = progressUpdate.tagsTotal;
      }

      // 更新已生成标签数
      if (progressUpdate.tagsBuilt) {
        if (progressUpdate.updateType === 'increment') {
          newProgress.tagsBuilt += progressUpdate.tagsBuilt;
        } else {
          newProgress.tagsBuilt = progressUpdate.tagsBuilt;
        }
      }

      // 更新问题总数
      if (progressUpdate.questionsTotal) {
        newProgress.questionsTotal = progressUpdate.questionsTotal;
      }

      // 更新已生成问题数
      if (progressUpdate.questionsBuilt) {
        if (progressUpdate.updateType === 'increment') {
          newProgress.questionsBuilt += progressUpdate.questionsBuilt;
        } else {
          newProgress.questionsBuilt = progressUpdate.questionsBuilt;
        }
      }

      // 更新数据集总数
      if (progressUpdate.datasetsTotal) {
        newProgress.datasetsTotal = progressUpdate.datasetsTotal;
      }

      // 更新已生成数据集数
      if (progressUpdate.datasetsBuilt) {
        if (progressUpdate.updateType === 'increment') {
          newProgress.datasetsBuilt += progressUpdate.datasetsBuilt;
        } else {
          newProgress.datasetsBuilt = progressUpdate.datasetsBuilt;
        }
      }

      // 更新多轮对话数据集总数
      if (progressUpdate.multiTurnDatasetsTotal) {
        newProgress.multiTurnDatasetsTotal = progressUpdate.multiTurnDatasetsTotal;
      }

      // 更新已生成多轮对话数据集数
      if (progressUpdate.multiTurnDatasetsBuilt) {
        if (progressUpdate.updateType === 'increment') {
          newProgress.multiTurnDatasetsBuilt += progressUpdate.multiTurnDatasetsBuilt;
        } else {
          newProgress.multiTurnDatasetsBuilt = progressUpdate.multiTurnDatasetsBuilt;
        }
      }

      return newProgress;
    });
  };

  // 添加日志，最多保留200条
  const addLog = message => {
    setDistillProgress(prev => {
      const newLogs = [...prev.logs, message];
      const limitedLogs = newLogs.length > 200 ? newLogs.slice(-200) : newLogs;
      return {
        ...prev,
        logs: limitedLogs
      };
    });
  };

  // 关闭进度对话框
  const handleCloseProgressDialog = () => {
    if (!autoDistillRunning) {
      setAutoDistillProgressOpen(false);
      fetchTags();
      fetchDistillStats();
      if (treeViewRef.current && typeof treeViewRef.current.fetchQuestionsStats === 'function') {
        treeViewRef.current.fetchQuestionsStats();
      }
    } else {
      setAutoDistillProgressOpen(false);
    }
  };

  if (!projectId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{t('common.projectIdRequired')}</Alert>
      </Container>
    );
  }

  return (
    <main style={{ 
      overflow: 'hidden', 
      position: 'relative', 
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* Hero Section - 科技感升级版 */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 10 },
          pb: { xs: 6, md: 8 },
          overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse 100% 60% at 50% 100%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse 100% 60% at 50% 100%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)'
        }}
      >
        {/* 动态网格背景 */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isDark
              ? `linear-gradient(rgba(139, 92, 246, 0.05) 1.5px, transparent 1.5px),
                 linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1.5px, transparent 1.5px)`
              : `linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            opacity: 0.5,
            zIndex: 0,
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
          }}
        />

        {/* 光晕装饰 */}
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          sx={{
            position: 'absolute',
            top: -100,
            left: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            zIndex: 0
          }}
        />
        
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          sx={{
            position: 'absolute',
            top: -50,
            right: '15%',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
            filter: 'blur(70px)',
            zIndex: 0
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 2
            }}
          >
            {/* 图标容器 */}
            <Box
              component={motion.div}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.6,
                delay: 0.2,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
                transition: { duration: 0.3 }
              }}
              sx={{
                width: { xs: 72, md: 88 },
                height: { xs: 72, md: 88 },
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: isDark
                  ? `0 12px 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)`
                  : `0 8px 32px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)`,
                position: 'relative',
                cursor: 'pointer',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '26px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  opacity: 0.3,
                  filter: 'blur(16px)',
                  zIndex: -1,
                  animation: 'pulse 3s ease-in-out infinite'
                },
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                  '50%': { opacity: 0.5, transform: 'scale(1.05)' }
                }
              }}
            >
              <ScienceIcon
                sx={{
                  fontSize: { xs: 40, md: 48 },
                  color: '#FFFFFF',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}
              />
            </Box>
            
            {/* 标题 */}
            <Typography
              component={motion.h1}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              variant={isMobile ? 'h3' : 'h2'}
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
                textShadow: isDark ? '0 0 40px rgba(139, 92, 246, 0.3)' : 'none'
              }}
            >
              {t('distill.title', '数据蒸馏')}
            </Typography>
            
            {/* 副标题 */}
            <Typography
              component={motion.p}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                maxWidth: 600,
                opacity: 0.85,
                letterSpacing: '0.01em',
                mb: 3
              }}
            >
              {t('distill.subtitle', '智能化构建领域知识体系，高效生成高质量问答数据')}
            </Typography>

            {/* 模型状态和操作按钮 */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              alignItems="center"
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* 模型状态 */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.05) 100%)',
                  border: `1px solid ${isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)'}`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              >
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: selectedModel ? theme.palette.success.main : theme.palette.error.main,
                    boxShadow: selectedModel 
                      ? `0 0 8px ${theme.palette.success.main}`
                      : `0 0 8px ${theme.palette.error.main}`
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    letterSpacing: 0.3,
                    color: 'text.primary'
                  }}
                >
                  {selectedModel ? selectedModelName : t('distill.noModelSelected', '未选择模型')}
                </Typography>
              </Box>

              {/* 操作按钮 */}
              <Button 
                variant="outlined" 
                size="large"
                onClick={handleOpenAutoDistillDialog} 
                disabled={!selectedModel} 
                startIcon={<AutoFixHighIcon />}
                sx={{
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  borderWidth: 2,
                  borderColor: '#8B5CF6',
                  color: '#8B5CF6',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#8B5CF6',
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha('#8B5CF6', 0.3)}`
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {t('distill.autoDistillButton', '自动蒸馏')}
              </Button>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => handleOpenTagDialog(null)} 
                disabled={!selectedModel} 
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  boxShadow: isDark
                    ? `0 8px 24px ${alpha('#8B5CF6', 0.4)}`
                    : `0 4px 16px ${alpha('#8B5CF6', 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? `0 12px 32px ${alpha('#8B5CF6', 0.5)}`
                      : `0 8px 24px ${alpha('#8B5CF6', 0.4)}`
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {t('distill.generateRootTags', '生成根标签')}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* 内容区域 */}
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: -6, md: -8 },
          mb: { xs: 6, md: 8 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* 统计卡片 */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
            {statCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.7 + index * 0.1,
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                  whileHover={{ 
                    y: -6, 
                    scale: 1.02,
                    transition: { duration: 0.2 } 
                  }}
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: '16px',
                    background: isDark
                      ? 'rgba(15, 23, 42, 0.9)'
                      : '#FFFFFF',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: isDark
                      ? `1px solid rgba(${card.glowColor}, 0.2)`
                      : '1px solid rgba(226, 232, 240, 1)',
                    boxShadow: isDark
                      ? `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(${card.glowColor}, 0.15)`
                      : `0 2px 12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)`,
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
                      background: card.gradient,
                      opacity: 0.8,
                      transition: 'height 0.3s ease, opacity 0.3s ease'
                    },
                    '&:hover': {
                      borderColor: isDark
                        ? `rgba(${card.glowColor}, 0.4)`
                        : `rgba(${card.glowColor}, 0.3)`,
                      boxShadow: isDark
                        ? `0 12px 40px rgba(${card.glowColor}, 0.25), 0 0 0 1px rgba(${card.glowColor}, 0.3)`
                        : `0 8px 32px rgba(${card.glowColor}, 0.12), 0 0 0 1px rgba(${card.glowColor}, 0.2)`,
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
                      background: card.gradient,
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
                        background: card.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isDark
                          ? `0 6px 20px rgba(${card.glowColor}, 0.35)`
                          : `0 4px 16px rgba(${card.glowColor}, 0.25)`,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          inset: -3,
                          borderRadius: '16px',
                          background: card.gradient,
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
                        {card.icon}
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
                          background: card.gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontSize: { xs: '1.75rem', md: '2rem' },
                          lineHeight: 1.2,
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {card.value}
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
                        {card.label}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* 主要内容区域 */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '18px',
              background: isDark
                ? 'rgba(15, 23, 42, 0.9)'
                : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(139, 92, 246, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                opacity: 0.6
              }
            }}
          >
            {error && (
              <Box sx={{ p: 3 }}>
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              </Box>
            )}

            {loading && !tags.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, p: 3 }}>
                <CircularProgress size={48} />
              </Box>
            ) : (
              <Box sx={{ p: 3 }}>
                <DistillTreeView
                  ref={treeViewRef}
                  projectId={projectId}
                  tags={tags}
                  onOpenTagDialog={handleOpenTagDialog}
                  onOpenQuestionDialog={handleOpenQuestionDialog}
                  onRefresh={() => {
                    fetchTags();
                    fetchDistillStats();
                  }}
                />
              </Box>
            )}
          </Paper>

        </motion.div>
      </Container>

      {/* Dialogs */}
      <TagGenerationDialog
        open={tagDialogOpen}
        onClose={() => setTagDialogOpen(false)}
        onGenerated={handleTagGenerated}
        projectId={projectId}
        parentTag={selectedTag}
        tagPath={selectedTagPath}
      />

      <QuestionGenerationDialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
        onGenerated={handleQuestionGenerated}
        projectId={projectId}
        tag={selectedTag}
        tagPath={selectedTagPath}
      />

      <AutoDistillDialog
        open={autoDistillDialogOpen}
        onClose={() => setAutoDistillDialogOpen(false)}
        onStart={handleStartAutoDistill}
      />

      <AutoDistillProgress
        open={autoDistillProgressOpen}
        onClose={handleCloseProgressDialog}
        progress={distillProgress}
        running={autoDistillRunning}
      />
    </main>
  );
}

