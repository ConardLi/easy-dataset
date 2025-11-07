'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';
import { Box, Typography, Paper, Container, Button, CircularProgress, Alert, IconButton, Tooltip, Chip, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DistillTreeView from '@/components/distill/DistillTreeView';
import TagGenerationDialog from '@/components/distill/TagGenerationDialog';
import QuestionGenerationDialog from '@/components/distill/QuestionGenerationDialog';
import AutoDistillDialog from '@/components/distill/AutoDistillDialog';
import AutoDistillProgress from '@/components/distill/AutoDistillProgress';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { autoDistillService } from './autoDistillService';
import axios from 'axios';
import { toast } from 'sonner';

export default function DistillPage() {
  const muiTheme = useTheme();
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
      {/* Tech gradient header bar */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          mb: 3,
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid',
          borderColor: muiTheme.palette.mode === 'dark' ? 'rgba(99,102,241,0.25)' : 'rgba(226,232,240,1)',
          background: muiTheme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,14,39,0.85) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          position: 'relative'
        }}
        className="tech-border"
      >
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Box sx={{
            position: 'absolute',
            top: -80,
            left: -40,
            width: 240,
            height: 240,
            background: muiTheme.palette.gradient.primary,
            opacity: muiTheme.palette.mode === 'dark' ? 0.15 : 0.10,
            filter: 'blur(60px)',
            borderRadius: '50%'
          }} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3.5, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="h1" fontWeight={800} className="gradient-text">
              {t('distill.title')}
            </Typography>
            <Tooltip title={t('common.help')}>
              <IconButton
                size="small"
                onClick={() => {
                  const helpUrl =
                    i18n.language === 'en'
                      ? 'https://docs.easy-dataset.com/ed/en/advanced/images-and-media'
                      : 'https://docs.easy-dataset.com/jin-jie-shi-yong/images-and-media';
                  window.open(helpUrl, '_blank');
                }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="primary"
              size="medium"
              onClick={handleOpenAutoDistillDialog}
              disabled={!selectedModel}
              startIcon={<AutoFixHighIcon />}
            >
              {t('distill.autoDistillButton')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => handleOpenTagDialog(null)}
              disabled={!selectedModel}
              startIcon={<AddIcon />}
            >
              {t('distill.generateRootTags')}
            </Button>
          </Box>
        </Box>

        {/* Stats strip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3.5, pb: 2.5, flexWrap: 'wrap' }}>
          <Chip
            label={`${t('distill.tags', '标签')} · ${distillStats.tagsCount}`}
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 700,
              px: 1,
              '& .MuiChip-label': { px: 1 },
            }}
          />
          <Chip
            label={`${t('distill.questions', '问题')} · ${distillStats.questionsCount}`}
            variant="outlined"
            sx={{ fontWeight: 700, px: 1, '& .MuiChip-label': { px: 1 } }}
          />
          <Chip
            label={`${t('distill.datasets', '数据集')} · ${distillStats.datasetsCount}`}
            variant="outlined"
            sx={{ fontWeight: 700, px: 1, '& .MuiChip-label': { px: 1 } }}
          />
          <Chip
            label={`${t('distill.multiTurn', '多轮对话')} · ${distillStats.multiTurnDatasetsCount}`}
            variant="outlined"
            sx={{ fontWeight: 700, px: 1, '& .MuiChip-label': { px: 1 } }}
          />
        </Box>
      </Paper>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: muiTheme.palette.mode === 'dark' ? 'rgba(99,102,241,0.22)' : 'rgba(226,232,240,1)',
          backgroundColor: muiTheme.palette.mode === 'dark' ? 'rgba(15,23,42,0.75)' : '#FFFFFF',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)'
        }}
        className="tech-border"
      >
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, paddingLeft: '32px' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" component="h1" fontWeight="bold">
              {t('distill.title')}
            </Typography>
            <Tooltip title={t('common.help')}>
              <IconButton
                size="small"
                onClick={() => {
                  const helpUrl =
                    i18n.language === 'en'
                      ? 'https://docs.easy-dataset.com/ed/en/advanced/images-and-media'
                      : 'https://docs.easy-dataset.com/jin-jie-shi-yong/images-and-media';
                  window.open(helpUrl, '_blank');
                }}
                sx={{ color: 'text.secondary' }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleOpenAutoDistillDialog}
              disabled={!selectedModel}
              startIcon={<AutoFixHighIcon />}
              sx={{ px: 3, py: 1 }}
            >
              {t('distill.autoDistillButton')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => handleOpenTagDialog(null)}
              disabled={!selectedModel}
              startIcon={<AddIcon />}
              sx={{ px: 3, py: 1 }}
            >
              {t('distill.generateRootTags')}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, px: 3, py: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }} className="tech-glow">
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
