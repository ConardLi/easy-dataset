'use client';

import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip, CircularProgress, Menu, MenuItem, Divider, ListItemIcon } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import useFileProcessingStatus from '@/hooks/useFileProcessingStatus';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import axios from 'axios';
import { toast } from 'sonner';

export default function TaskIcon({ projectId, theme }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [tasks, setTasks] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const selectedModel = useAtomValue(selectedModelInfoAtom);
  const { setTaskFileProcessing, setTask } = useFileProcessingStatus();

  const fetchPendingTasks = async () => {
    if (!projectId) return;

    try {
      const response = await axios.get(`/api/projects/${projectId}/tasks/list?status=0`);
      if (response.data?.code === 0) {
        const pendingTasks = response.data.data || [];
        setTasks(pendingTasks);

        const hasActiveFileTask = pendingTasks.some(
          task => task.projectId === projectId && task.taskType === 'file-processing'
        );
        setTaskFileProcessing(hasActiveFileTask);

        if (hasActiveFileTask) {
          const activeTask = pendingTasks.find(task => task.projectId === projectId && task.taskType === 'file-processing');
          try {
            const detailInfo = JSON.parse(activeTask?.detail || '{}');
            setTask(detailInfo);
          } catch {
            setTask(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch task list:', error);
    }
  };

  useEffect(() => {
    if (!projectId) return;

    fetchPendingTasks();

    const intervalId = setInterval(() => {
      fetchPendingTasks();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId]);

  useEffect(() => {
    setMenuAnchorEl(null);
  }, [pathname]);

  const handleOpenTaskList = () => {
    setMenuAnchorEl(null);
    router.push(`/projects/${projectId}/tasks`);
  };

  const handleMenuOpen = event => {
    if (isMenuOpen) {
      setMenuAnchorEl(null);
      return;
    }
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const createBatchTask = async (taskType, detail) => {
    if (!projectId || !selectedModel?.id) {
      toast.error(t('textSplit.selectModelFirst', { defaultValue: '璇峰厛閫夋嫨妯″瀷' }));
      return;
    }

    try {
      const response = await axios.post(`/api/projects/${projectId}/tasks`, {
        taskType,
        modelInfo: selectedModel,
        language: i18n.language,
        detail
      });

      if (response.data?.code === 0) {
        toast.success(t('tasks.createSuccess', { defaultValue: '浠诲姟鍒涘缓鎴愬姛' }));
        await fetchPendingTasks();
      } else {
        toast.error(`${t('tasks.createFailed', { defaultValue: '浠诲姟鍒涘缓澶辫触' })}: ${response.data?.message || ''}`);
      }
    } catch (error) {
      console.error('Create batch task failed:', error);
      toast.error(`${t('tasks.createFailed', { defaultValue: '浠诲姟鍒涘缓澶辫触' })}: ${error.message}`);
    }
  };

  const handleCreateAutoQuestionTask = async () => {
    await createBatchTask('question-generation', '批量生成问题任务');
    handleMenuClose();
  };

  const handleCreateAutoEvalTask = async () => {
    await createBatchTask('eval-generation', '批量生成评估集任务');
    handleMenuClose();
  };

  const handleCreateAutoCleaningTask = async () => {
    await createBatchTask('data-cleaning', '批量数据清洗任务');
    handleMenuClose();
  };

  const renderTaskIcon = () => {
    const pendingTasks = tasks.filter(task => task.status === 0);

    if (pendingTasks.length > 0) {
      return (
        <Badge badgeContent={pendingTasks.length} color="error">
          <CircularProgress size={20} color="inherit" />
        </Badge>
      );
    }

    return <TaskAltIcon fontSize="small" />;
  };

  const getTooltipText = () => {
    const pendingTasks = tasks.filter(task => task.status === 0);

    if (pendingTasks.length > 0) {
      return t('tasks.pending', { count: pendingTasks.length });
    }

    return t('tasks.completed');
  };

  if (!projectId) return null;

  return (
    <>
      <Tooltip title={getTooltipText()}>
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
            color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
            p: 1,
            borderRadius: 1.5,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
            }
          }}
        >
          {renderTaskIcon()}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        hideBackdrop
        disableScrollLock
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleOpenTaskList}>
          <ListItemIcon>
            <ListAltIcon fontSize="small" />
          </ListItemIcon>
          {t('tasks.title')}
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleCreateAutoQuestionTask} disabled={!selectedModel?.id}>
          <ListItemIcon>
            <QuizIcon fontSize="small" />
          </ListItemIcon>
          {t('textSplit.autoGenerateQuestions', { defaultValue: '自动提取问题' })}
        </MenuItem>

        <MenuItem onClick={handleCreateAutoEvalTask} disabled={!selectedModel?.id}>
          <ListItemIcon>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          {t('textSplit.autoEvalGeneration', { defaultValue: '自动生成评估集' })}
        </MenuItem>

        <MenuItem onClick={handleCreateAutoCleaningTask} disabled={!selectedModel?.id}>
          <ListItemIcon>
            <CleaningServicesIcon fontSize="small" />
          </ListItemIcon>
          {t('textSplit.autoDataCleaning', { defaultValue: '自动数据清洗' })}
        </MenuItem>
      </Menu>
    </>
  );
}

