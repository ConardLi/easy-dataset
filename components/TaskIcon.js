'use client';

import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip, Box, CircularProgress } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import useFileProcessingStatus from '@/hooks/useFileProcessingStatus';
import axios from 'axios';

// 任务图标组件
export default function TaskIcon({ projectId, theme }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [polling, setPolling] = useState(false);
  const { setTaskFileProcessing, setTask } = useFileProcessingStatus();

  // 获取项目的未完成任务列表
  const fetchPendingTasks = async () => {
    if (!projectId) return;

    try {
      const response = await axios.get(`/api/projects/${projectId}/tasks/list?status=0`);
      if (response.data?.code === 0) {
        const tasks = response.data.data || [];
        setTasks(tasks);
        // 检查是否有文件处理任务正在进行
        const hasActiveFileTask = tasks.some(
          task => task.projectId === projectId && task.taskType === 'file-processing'
        );
        setTaskFileProcessing(hasActiveFileTask);
        //存在文件处理任务，将任务信息传递给共享状态
        if (hasActiveFileTask) {
          const activeTask = tasks.find(task => task.projectId === projectId && task.taskType === 'file-processing');
          // 解析任务详情信息
          const detailInfo = JSON.parse(activeTask.detail);
          setTask(detailInfo);
        }
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  };

  // 初始化时获取任务列表
  useEffect(() => {
    if (projectId) {
      fetchPendingTasks();

      // 启动轮询
      const intervalId = setInterval(() => {
        fetchPendingTasks();
      }, 10000); // 每10秒轮询一次

      setPolling(true);

      return () => {
        clearInterval(intervalId);
        setPolling(false);
      };
    }
  }, [projectId]);

  // 打开任务列表页面
  const handleOpenTaskList = () => {
    router.push(`/projects/${projectId}/tasks`);
  };

  // 图标渲染逻辑
  const renderTaskIcon = () => {
    const pendingTasks = tasks.filter(task => task.status === 0);

    if (pendingTasks.length > 0) {
      // 当有任务处理中时，显示 loading 状态同时保留徽标
      return (
        <Badge badgeContent={pendingTasks.length} color="error">
          <CircularProgress size={20} color="inherit" />
        </Badge>
      );
    }

    // 没有处理中的任务时，显示完成图标
    return (
      <TaskAltIcon 
        fontSize="small" 
        sx={{
          color: theme.palette.mode === 'dark' 
            ? 'inherit' 
            : theme.palette.text.primary || '#1E293B'
        }} 
      />
    );
  };

  // 悬停提示文本
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
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : theme.palette.action.hover,
          color:
            theme.palette.mode === 'dark'
              ? 'inherit'
              : theme.palette.primary.main,
          p: 1,
          borderRadius: 1.5,
          border: theme.palette.mode === 'dark' ? 'none' : `1px solid ${theme.palette.primary.main}20`,
          '&:hover': {
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : theme.palette.action.selected
          },
          ml: 2
        }}
      >
        {renderTaskIcon()}
      </IconButton>
    </Tooltip>
  );
}
