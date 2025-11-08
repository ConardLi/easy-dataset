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
    multiTurnDatasetsTotal: 0, // 新增多轮对话数据集总数
    multiTurnDatasetsBuilt: 0, // 新增多轮对话数据集已生成数
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
      shadow: 'rgba(99, 102, 241, 0.35)',
      icon: <CategoryOutlinedIcon sx={{ fontSize: 30 }} />
    },
    {
      label: t('distill.stats.questions', '生成问题'),
      value: distillStats.questionsCount,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      shadow: 'rgba(6, 182, 212, 0.35)',
      icon: <QuizOutlinedIcon sx={{ fontSize: 30 }} />
    },
    {
      label: t('distill.stats.datasets', '单轮数据集'),
      value: distillStats.datasetsCount,
      gradient: 'linear-gradient(135deg, #22C55E 0%, #059669 100%)',
      shadow: 'rgba(34, 197, 94, 0.35)',
      icon: <DataObjectOutlinedIcon sx={{ fontSize: 30 }} />
    },
    {
      label: t('distill.stats.multiTurn', '多轮对话'),
      value: distillStats.multiTurnDatasetsCount,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      shadow: 'rgba(245, 158, 11, 0.35)',
      icon: <ForumOutlinedIcon sx={{ fontSize: 30 }} />
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
    fetchTags(); // 重新获取标签列表
    setTagDialogOpen(false);
  };

  // 处理问题生成完成
  const handleQuestionGenerated = () => {
    // 关闭对话框
    setQuestionDialogOpen(false);

    // 刷新标签数据
    fetchTags();
    fetchDistillStats();

    // 如果 treeViewRef 存在且有 fetchQuestionsStats 方法，则调用它刷新问题统计信息
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
  const handleStartAutoDistill = async config => {
    setAutoDistillDialogOpen(false);
    setAutoDistillProgressOpen(true);
    setAutoDistillRunning(true);

    // 初始化进度信息
    setDistillProgress({
      stage: 'initializing',
      tagsTotal: config.estimatedTags,
      tagsBuilt: distillStats.tagsCount || 0,
      questionsTotal: config.estimatedQuestions,
      questionsBuilt: distillStats.questionsCount || 0,
      datasetsTotal: config.estimatedQuestions, // 初步设置数据集总数为问题数，后面会更新
      datasetsBuilt: distillStats.datasetsCount || 0, // 根据当前已生成的数据集数量初始化
      multiTurnDatasetsTotal:
        config.datasetType === 'multi-turn' || config.datasetType === 'both' ? config.estimatedQuestions : 0,
      multiTurnDatasetsBuilt: distillStats.multiTurnDatasetsCount || 0,
      logs: [t('distill.autoDistillStarted', { time: new Date().toLocaleTimeString() })]
    });

    try {
      // 检查模型是否存在
      if (!selectedModel || Object.keys(selectedModel).length === 0) {
        addLog(t('distill.selectModelFirst'));
        setAutoDistillRunning(false);
        return;
      }

      // 使用 autoDistillService 执行蒸馏任务
      await autoDistillService.executeDistillTask({
        projectId,
        topic: config.topic,
        levels: config.levels,
        tagsPerLevel: config.tagsPerLevel,
        questionsPerTag: config.questionsPerTag,
        datasetType: config.datasetType, // 新增数据集类型参数
        model: selectedModel,
        language: i18n.language,
        concurrencyLimit: project?.taskConfig?.concurrencyLimit || 5, // 从项目配置中获取并发限制
        onProgress: updateProgress,
        onLog: addLog
      });

      // 更新任务状态
      setAutoDistillRunning(false);
    } catch (error) {
      console.error('自动蒸馏任务执行失败:', error);
      addLog(t('distill.taskExecutionError', { error: error.message || t('common.unknownError') }));
      setAutoDistillRunning(false);
    }
  };

  // 开始自动蒸馏任务（后台运行）
  const handleStartAutoDistillBackground = async config => {
    setAutoDistillDialogOpen(false);

    try {
      // 检查模型是否存在
      if (!selectedModel || Object.keys(selectedModel).length === 0) {
        setError(t('distill.selectModelFirst'));
        return;
      }

      // 创建后台任务
      const response = await axios.post(`/api/projects/${projectId}/tasks`, {
        taskType: 'data-distillation',
        modelInfo: selectedModel,
        language: i18n.language,
        detail: t('distill.autoDistillTaskDetail', { topic: config.topic }),
        totalCount: config.estimatedQuestions,
        note: {
          topic: config.topic,
          levels: config.levels,
          tagsPerLevel: config.tagsPerLevel,
          questionsPerTag: config.questionsPerTag,
          datasetType: config.datasetType,
          estimatedTags: config.estimatedTags,
          estimatedQuestions: config.estimatedQuestions
        }
      });

      if (response.data.code === 0) {
        toast.success(t('distill.backgroundTaskCreated'));
        // 3秒后刷新统计信息
        setTimeout(() => {
          fetchDistillStats();
        }, 3000);
      } else {
        toast.error(response.data.message || t('distill.backgroundTaskFailed'));
      }
    } catch (error) {
      console.error('创建后台蒸馏任务失败:', error);
      toast.error(error.message || t('distill.backgroundTaskFailed'));
    }
  };

  // 更新进度
  const updateProgress = progressUpdate => {
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

      // 更新已构建标签数
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
      // 如果日志超过200条，只保留最新的200条
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
      // 刷新数据
      fetchTags();
      fetchDistillStats();
      if (treeViewRef.current && typeof treeViewRef.current.fetchQuestionsStats === 'function') {
        treeViewRef.current.fetchQuestionsStats();
      }
    } else {
      // 如果任务还在运行，可以展示一个确认对话框
      // 这里简化处理，直接关闭
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* 顶部 Hero 区域：品牌级渐变 + 行为区 */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          mb: 3,
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.25)' : 'rgba(226,232,240,1)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(16,24,40,0.9) 0%, rgba(11,18,33,0.86) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(24px) saturate(170%)',
          WebkitBackdropFilter: 'blur(24px) saturate(170%)',
          position: 'relative'
        }}
        className="tech-border"
      >
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Box sx={{ position: 'absolute', top: -80, left: -60, width: 260, height: 260, background: theme.palette.gradient.primary, opacity: theme.palette.mode === 'dark' ? 0.16 : 0.10, filter: 'blur(70px)', borderRadius: '50%' }} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3.5, py: 3, flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5" component="h1" fontWeight={800} className="gradient-text">
              {t('distill.title')}
            </Typography>
            <Box
              sx={{
                px: 1.75,
                py: 0.6,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.28) 0%, rgba(56,189,248,0.24) 100%)'
                  : 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(56,189,248,0.1) 100%)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.4)' : 'rgba(59,130,246,0.3)'
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: theme.palette.success.main }} />
              <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.4 }}>
                {selectedModel ? selectedModelName : t('distill.noModelSelected', '未选择模型')}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" color="primary" size="medium" onClick={handleOpenAutoDistillDialog} disabled={!selectedModel} startIcon={<AutoFixHighIcon />}>{t('distill.autoDistillButton')}</Button>
            <Button variant="contained" color="primary" size="medium" onClick={() => handleOpenTagDialog(null)} disabled={!selectedModel} startIcon={<AddIcon />}>{t('distill.generateRootTags')}</Button>
          </Stack>
        </Box>

        {/* 关键指标 */}
        <Box sx={{ px: 3.5, pb: 3.5 }}>
          <Grid container spacing={2.2}>
            {statCards.map((card, index) => {
              const icon = React.cloneElement(card.icon, {
                sx: {
                  fontSize: 26,
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)'
                }
              });
              return (
                <Grid item xs={6} sm={3} key={card.label}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      px: 2.25,
                      py: 2,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.26)',
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(140deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.82) 100%)'
                        : 'linear-gradient(140deg, rgba(248,250,252,0.82) 0%, rgba(241,245,249,0.9) 100%)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 12px 32px rgba(15,23,42,0.45)'
                        : '0 8px 26px rgba(15,23,42,0.12)',
                      transition: 'all 0.25s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: card.gradient,
                        opacity: theme.palette.mode === 'dark' ? 0.18 : 0.12,
                        mixBlendMode: 'screen'
                      },
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 16px 40px rgba(59,130,246,0.28)'
                          : '0 14px 34px rgba(59,130,246,0.18)',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.45)' : 'rgba(59,130,246,0.32)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(226,232,240,0.75)' : 'rgba(15,23,42,0.65)', fontWeight: 600 }}>
                          {card.label}
                        </Typography>
                        <Box sx={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: '10px', background: `${card.gradient}22` }}>
                          {icon}
                        </Box>
                      </Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          background: card.gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>

      {/* 主体双栏：左侧操作与提示，右侧内容树 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.22)' : 'rgba(226,232,240,1)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.75)' : '#FFFFFF',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)'
            }}
            className="tech-border"
          >
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" fontWeight={700}>{t('distill.actions', '操作')}</Typography>
              <Stack direction="row" spacing={1.5}>
                <Button fullWidth variant="contained" color="primary" onClick={() => handleOpenTagDialog(null)} disabled={!selectedModel} startIcon={<AddIcon />}>{t('distill.generateRootTags')}</Button>
                <Button fullWidth variant="outlined" color="primary" onClick={handleOpenAutoDistillDialog} disabled={!selectedModel} startIcon={<AutoFixHighIcon />}>{t('distill.autoDistillButton')}</Button>
              </Stack>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="subtitle1" fontWeight={700}>{t('distill.quickTips', '使用建议')}</Typography>
              <Stack spacing={1.25}>
                {quickTips.map((tip, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #60A5FA 0%, #38BDF8 100%)',
                        boxShadow: '0 0 12px rgba(56,189,248,0.45)'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{tip}</Typography>
                  </Box>
                ))}
              </Stack>
              {recentLogs.length > 0 && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={700}>{t('distill.recentLogs', '最近进度')}</Typography>
                  <Stack spacing={1}>
                    {recentLogs.map((log, i) => (
                      <Typography key={i} variant="caption" color="text.secondary">• {log}</Typography>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.22)' : 'rgba(226,232,240,1)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.75)' : '#FFFFFF',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)'
            }}
            className="tech-border"
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3, px: 3, py: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <Box sx={{ mt: 0 }} className="tech-glow">
                <DistillTreeView
                  ref={treeViewRef}
                  projectId={projectId}
                  tags={tags}
                  onGenerateSubTags={handleOpenTagDialog}
                  onGenerateQuestions={handleOpenQuestionDialog}
                  onTagsUpdate={setTags}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 生成标签对话框 */}
      {tagDialogOpen && (
        <TagGenerationDialog
          open={tagDialogOpen}
          onClose={() => setTagDialogOpen(false)}
          onGenerated={handleTagGenerated}
          projectId={projectId}
          parentTag={selectedTag}
          tagPath={selectedTagPath}
          model={selectedModel}
        />
      )}

      {/* 生成问题对话框 */}
      {questionDialogOpen && (
        <QuestionGenerationDialog
          open={questionDialogOpen}
          onClose={() => setQuestionDialogOpen(false)}
          onGenerated={handleQuestionGenerated}
          projectId={projectId}
          tag={selectedTag}
          tagPath={selectedTagPath}
          model={selectedModel}
        />
      )}

      {/* 全自动蒸馏数据集配置对话框 */}
      <AutoDistillDialog
        open={autoDistillDialogOpen}
        onClose={() => setAutoDistillDialogOpen(false)}
        onStart={handleStartAutoDistill}
        onStartBackground={handleStartAutoDistillBackground}
        projectId={projectId}
        project={project}
        stats={distillStats}
      />

      {/* 全自动蒸馏进度对话框 */}
      <AutoDistillProgress
        open={autoDistillProgressOpen}
        onClose={handleCloseProgressDialog}
        progress={distillProgress}
      />
    </Container>
  );
}
