'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, IconButton, Paper, useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import TaskIcon from '@mui/icons-material/Task';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// 导入任务管理组件
import TaskFilters from '@/components/tasks/TaskFilters';
import TasksTable from '@/components/tasks/TasksTable';

export default function TasksPage({ params }) {
  const { projectId } = params;
  const { t } = useTranslation();

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 分页相关状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 获取任务列表
  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      // 构建查询参数
      let url = `/api/projects/${projectId}/tasks/list`;
      const queryParams = [];

      if (statusFilter !== 'all') {
        queryParams.push(`status=${statusFilter}`);
      }

      if (typeFilter !== 'all') {
        queryParams.push(`taskType=${typeFilter}`);
      }

      // 添加分页参数
      queryParams.push(`page=${page}`);
      queryParams.push(`limit=${rowsPerPage}`);

      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }

      const response = await axios.get(url);
      if (response.data?.code === 0) {
        setTasks(response.data.data || []);
        // 设置总记录数
        setTotalCount(response.data.total || response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
      toast.error(t('tasks.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 初始化和过滤器变更时获取任务列表
  useEffect(() => {
    fetchTasks();

    // 定时刷新处理中的任务
    const intervalId = setInterval(() => {
      if (statusFilter === 'all' || statusFilter === '0') {
        fetchTasks();
      }
    }, 5000); // 每5秒更新一次处理中的任务

    return () => clearInterval(intervalId);
  }, [projectId, statusFilter, typeFilter, page, rowsPerPage]);

  // 删除任务
  const handleDeleteTask = async taskId => {
    if (!confirm(t('tasks.confirmDelete'))) return;

    try {
      const response = await axios.delete(`/api/projects/${projectId}/tasks/${taskId}`);
      if (response.data?.code === 0) {
        toast.success(t('tasks.deleteSuccess'));
        fetchTasks();
      } else {
        toast.error(t('tasks.deleteFailed'));
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      toast.error(t('tasks.deleteFailed'));
    }
  };

  // 中断任务
  const handleAbortTask = async taskId => {
    if (!confirm(t('tasks.confirmAbort'))) return;

    try {
      const response = await axios.patch(`/api/projects/${projectId}/tasks/${taskId}`, {
        status: 3, // 3 表示已中断
        detail: t('tasks.status.aborted'),
        note: t('tasks.status.aborted')
      });

      if (response.data?.code === 0) {
        toast.success(t('tasks.abortSuccess'));
        fetchTasks();
      } else {
        toast.error(t('tasks.abortFailed'));
      }
    } catch (error) {
      console.error('中断任务失败:', error);
      toast.error(t('tasks.abortFailed'));
    }
  };

  // 分页参数更改处理
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          pt: { xs: 6, md: 8 },
          pb: { xs: 4, md: 6 },
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

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2
            }}
          >
            <TaskIcon
              sx={{
                fontSize: { xs: 32, md: 40 },
                mr: 2,
                color: theme.palette.primary.main,
                filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}40)`
              }}
            />
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('tasks.title')}
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
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              {/* 任务筛选器组件 */}
              <TaskFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                loading={loading}
                onRefresh={fetchTasks}
              />
            </Box>
          </Paper>

          {/* 任务表格组件 */}
          <Paper
            elevation={0}
            sx={{
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
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden'
            }}
          >
            <TasksTable
        tasks={tasks}
        loading={loading}
        handleAbortTask={handleAbortTask}
        handleDeleteTask={handleDeleteTask}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              totalCount={totalCount}
            />
          </Paper>
        </motion.div>
      </Container>
    </main>
  );
}
