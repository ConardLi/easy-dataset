'use client';

import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip, CircularProgress } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import useFileProcessingStatus from '@/hooks/useFileProcessingStatus';
import axios from 'axios';

export default function TaskIcon({ projectId, theme }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
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
          const activeTask = pendingTasks.find(
            task => task.projectId === projectId && task.taskType === 'file-processing'
          );
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

  const handleOpenTaskList = () => {
    router.push(`/projects/${projectId}/tasks`);
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
    <Tooltip title={getTooltipText()}>
      <IconButton
        onClick={handleOpenTaskList}
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
  );
}
