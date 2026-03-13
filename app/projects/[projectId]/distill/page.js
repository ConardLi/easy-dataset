'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';
import { Box, Typography, Paper, Container, Button, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
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

/**
 * 将 progressUpdate 转化为带有增量标记的快照对象
 */
function buildProgressSnapshot(update) {
  const snap = { ...update };
  if (update.updateType === 'increment') {
    if (update.tagsBuilt != null) snap._tagsBuiltIncrement = true;
    if (update.questionsBuilt != null) snap._questionsBuiltIncrement = true;
    if (update.datasetsBuilt != null) snap._datasetsBuiltIncrement = true;
    if (update.multiTurnDatasetsBuilt != null) snap._multiTurnIncrement = true;
  }
  return snap;
}

/**
 * 将新的 progressUpdate 合并到已有快照中（累加增量字段，覆盖绝对值字段）
 */
function mergeProgressUpdate(prev, update) {
  const next = { ...prev };
  if (update.stage) next.stage = update.stage;
  if (update.tagsTotal) next.tagsTotal = update.tagsTotal;
  if (update.questionsTotal) next.questionsTotal = update.questionsTotal;
  if (update.datasetsTotal) next.datasetsTotal = update.datasetsTotal;
  if (update.multiTurnDatasetsTotal) next.multiTurnDatasetsTotal = update.multiTurnDatasetsTotal;

  const isIncrement = update.updateType === 'increment';

  if (update.tagsBuilt != null) {
    if (isIncrement) {
      // 增量模式：无论是否已有增量标记，都累加
      next.tagsBuilt = (prev.tagsBuilt || 0) + update.tagsBuilt;
      next._tagsBuiltIncrement = true;
    } else {
      next.tagsBuilt = update.tagsBuilt;
      next._tagsBuiltIncrement = false;
    }
  }
  if (update.questionsBuilt != null) {
    if (isIncrement) {
      next.questionsBuilt = (prev.questionsBuilt || 0) + update.questionsBuilt;
      next._questionsBuiltIncrement = true;
    } else {
      next.questionsBuilt = update.questionsBuilt;
      next._questionsBuiltIncrement = false;
    }
  }
  if (update.datasetsBuilt != null) {
    if (isIncrement) {
      next.datasetsBuilt = (prev.datasetsBuilt || 0) + update.datasetsBuilt;
      next._datasetsBuiltIncrement = true;
    } else {
      next.datasetsBuilt = update.datasetsBuilt;
      next._datasetsBuiltIncrement = false;
    }
  }
  if (update.multiTurnDatasetsBuilt != null) {
    if (isIncrement) {
      next.multiTurnDatasetsBuilt = (prev.multiTurnDatasetsBuilt || 0) + update.multiTurnDatasetsBuilt;
      next._multiTurnIncrement = true;
    } else {
      next.multiTurnDatasetsBuilt = update.multiTurnDatasetsBuilt;
      next._multiTurnIncrement = false;
    }
  }
  return next;
}

export default function DistillPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();
  const selectedModel = useAtomValue(selectedModelInfoAtom);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  // 问题列表状态提升到 page 层，供 DistillTreeView 直接使用，避免重复请求
  const [distillQuestions, setDistillQuestions] = useState(null);

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

  // 用于批量缓冲日志和进度更新，避免高并发时频繁 setState 卡死页面
  const pendingLogsRef = useRef([]);
  const pendingProgressRef = useRef(null);
  const batchTimerRef = useRef(null);

  // 启动批量刷新定时器（每300ms合并一次更新到 state）
  const startBatchTimer = useCallback(() => {
    if (batchTimerRef.current) return;
    batchTimerRef.current = setInterval(() => {
      const hasPendingLogs = pendingLogsRef.current.length > 0;
      const hasPendingProgress = pendingProgressRef.current !== null;
      if (!hasPendingLogs && !hasPendingProgress) return;

      const logsSnapshot = pendingLogsRef.current;
      const progressSnapshot = pendingProgressRef.current;
      pendingLogsRef.current = [];
      pendingProgressRef.current = null;

      setDistillProgress(prev => {
        let next = { ...prev };

        // 合并进度更新
        if (progressSnapshot) {
          if (progressSnapshot.stage) next.stage = progressSnapshot.stage;
          if (progressSnapshot.tagsTotal) next.tagsTotal = progressSnapshot.tagsTotal;
          if (progressSnapshot.tagsBuilt != null) {
            next.tagsBuilt = progressSnapshot._tagsBuiltIncrement
              ? (prev.tagsBuilt || 0) + progressSnapshot.tagsBuilt
              : progressSnapshot.tagsBuilt;
          }
          if (progressSnapshot.questionsTotal) next.questionsTotal = progressSnapshot.questionsTotal;
          if (progressSnapshot.questionsBuilt != null) {
            next.questionsBuilt = progressSnapshot._questionsBuiltIncrement
              ? (prev.questionsBuilt || 0) + progressSnapshot.questionsBuilt
              : progressSnapshot.questionsBuilt;
          }
          if (progressSnapshot.datasetsTotal) next.datasetsTotal = progressSnapshot.datasetsTotal;
          if (progressSnapshot.datasetsBuilt != null) {
            next.datasetsBuilt = progressSnapshot._datasetsBuiltIncrement
              ? (prev.datasetsBuilt || 0) + progressSnapshot.datasetsBuilt
              : progressSnapshot.datasetsBuilt;
          }
          if (progressSnapshot.multiTurnDatasetsTotal) next.multiTurnDatasetsTotal = progressSnapshot.multiTurnDatasetsTotal;
          if (progressSnapshot.multiTurnDatasetsBuilt != null) {
            next.multiTurnDatasetsBuilt = progressSnapshot._multiTurnIncrement
              ? (prev.multiTurnDatasetsBuilt || 0) + progressSnapshot.multiTurnDatasetsBuilt
              : progressSnapshot.multiTurnDatasetsBuilt;
          }
        }

        // 合并日志，最多保留200条
        if (logsSnapshot.length > 0) {
          const merged = [...prev.logs, ...logsSnapshot];
          next.logs = merged.length > 200 ? merged.slice(-200) : merged;
        }

        return next;
      });
    }, 300);
  }, []);

  // 停止批量刷新定时器
  const stopBatchTimer = useCallback(() => {
    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      batchTimerRef.current = null;
    }
  }, []);

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
      // 获取标签数量（复用 fetchTags 已有数据时可跳过，此处保留独立请求以保证统计准确）
      const tagsResponse = await axios.get(`/api/projects/${projectId}/distill/tags/all`);
      const tagsCount = tagsResponse.data.length;

      // 获取问题数量（同时保存到 distillQuestions，供 DistillTreeView 直接使用）
      const questionsResponse = await axios.get(`/api/projects/${projectId}/questions/tree?isDistill=true`);
      const questionsData = questionsResponse.data;
      const questionsCount = questionsData.length;
      setDistillQuestions(questionsData);

      // 获取数据集数量
      const datasetsCount = questionsData.filter(q => q.answered).length;

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

    // 刷新标签数据和统计信息（fetchDistillStats 内部已同步更新 distillQuestions）
    fetchTags();
    fetchDistillStats();
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

    // 启动批量刷新定时器
    startBatchTimer();

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
        stopBatchTimer();
        flushPendingUpdates();
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

      // 停止批量刷新定时器，最后flush一次确保所有更新到位
      stopBatchTimer();
      // 强制flush剩余缓冲
      flushPendingUpdates();
      setAutoDistillRunning(false);
    } catch (error) {
      console.error('自动蒸馏任务执行失败:', error);
      stopBatchTimer();
      addLog(t('distill.taskExecutionError', { error: error.message || t('common.unknownError') }));
      flushPendingUpdates();
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

  // 立即将缓冲区剩余内容刷新到 state（任务结束时调用）
  const flushPendingUpdates = useCallback(() => {
    const logsSnapshot = pendingLogsRef.current;
    const progressSnapshot = pendingProgressRef.current;
    pendingLogsRef.current = [];
    pendingProgressRef.current = null;
    if (logsSnapshot.length === 0 && progressSnapshot === null) return;
    setDistillProgress(prev => {
      let next = { ...prev };
      if (progressSnapshot) {
        if (progressSnapshot.stage) next.stage = progressSnapshot.stage;
        if (progressSnapshot.tagsTotal) next.tagsTotal = progressSnapshot.tagsTotal;
        if (progressSnapshot.tagsBuilt != null) {
          next.tagsBuilt = progressSnapshot._tagsBuiltIncrement
            ? (prev.tagsBuilt || 0) + progressSnapshot.tagsBuilt
            : progressSnapshot.tagsBuilt;
        }
        if (progressSnapshot.questionsTotal) next.questionsTotal = progressSnapshot.questionsTotal;
        if (progressSnapshot.questionsBuilt != null) {
          next.questionsBuilt = progressSnapshot._questionsBuiltIncrement
            ? (prev.questionsBuilt || 0) + progressSnapshot.questionsBuilt
            : progressSnapshot.questionsBuilt;
        }
        if (progressSnapshot.datasetsTotal) next.datasetsTotal = progressSnapshot.datasetsTotal;
        if (progressSnapshot.datasetsBuilt != null) {
          next.datasetsBuilt = progressSnapshot._datasetsBuiltIncrement
            ? (prev.datasetsBuilt || 0) + progressSnapshot.datasetsBuilt
            : progressSnapshot.datasetsBuilt;
        }
        if (progressSnapshot.multiTurnDatasetsTotal) next.multiTurnDatasetsTotal = progressSnapshot.multiTurnDatasetsTotal;
        if (progressSnapshot.multiTurnDatasetsBuilt != null) {
          next.multiTurnDatasetsBuilt = progressSnapshot._multiTurnIncrement
            ? (prev.multiTurnDatasetsBuilt || 0) + progressSnapshot.multiTurnDatasetsBuilt
            : progressSnapshot.multiTurnDatasetsBuilt;
        }
      }
      if (logsSnapshot.length > 0) {
        const merged = [...prev.logs, ...logsSnapshot];
        next.logs = merged.length > 200 ? merged.slice(-200) : merged;
      }
      return next;
    });
  }, []);

  // 更新进度 - 写入缓冲区，由定时器批量刷新到 state，避免高并发时频繁渲染
  const updateProgress = useCallback(progressUpdate => {
    pendingProgressRef.current = pendingProgressRef.current
      ? mergeProgressUpdate(pendingProgressRef.current, progressUpdate)
      : buildProgressSnapshot(progressUpdate);
  }, []);

  // 添加日志 - 写入缓冲区，由定时器批量刷新
  const addLog = useCallback(message => {
    pendingLogsRef.current.push(message);
  }, []);

  // 关闭进度对话框
  const handleCloseProgressDialog = () => {
    if (!autoDistillRunning) {
      setAutoDistillProgressOpen(false);
      // 刷新数据（fetchDistillStats 内部已同步更新 distillQuestions）
      fetchTags();
      fetchDistillStats();
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
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
          <Box sx={{ mt: 2 }}>
            <DistillTreeView
              ref={treeViewRef}
              projectId={projectId}
              tags={tags}
              initialQuestions={distillQuestions}
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
