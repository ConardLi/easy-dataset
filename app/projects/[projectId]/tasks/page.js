'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, LinearProgress, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import TaskIcon from '@mui/icons-material/Task';
import { toast } from 'sonner';

import TaskFilters from '@/components/tasks/TaskFilters';
import TasksTable from '@/components/tasks/TasksTable';

export default function TasksPage({ params }) {
  const { projectId } = params;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const processingTasks = tasks.filter(task => task.status === 0 && task.totalCount > 0);
  const totalProgressCount = processingTasks.reduce((sum, task) => sum + task.totalCount, 0);
  const completedProgressCount = processingTasks.reduce((sum, task) => sum + task.completedCount, 0);
  const overallProgress = totalProgressCount > 0 ? Math.round((completedProgressCount / totalProgressCount) * 100) : 0;

  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      let url = `/api/projects/${projectId}/tasks/list`;
      const queryParams = [];

      if (statusFilter !== 'all') {
        queryParams.push(`status=${statusFilter}`);
      }

      if (typeFilter !== 'all') {
        queryParams.push(`taskType=${typeFilter}`);
      }

      queryParams.push(`page=${page}`);
      queryParams.push(`limit=${rowsPerPage}`);

      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const response = await axios.get(url);
      if (response.data?.code === 0) {
        setTasks(response.data.data || []);
        setTotalCount(response.data.total || response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error(t('tasks.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const intervalId = setInterval(() => {
      if (statusFilter === 'all' || statusFilter === '0') {
        fetchTasks();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [projectId, statusFilter, typeFilter, page, rowsPerPage]);

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
      console.error('Failed to delete task:', error);
      toast.error(t('tasks.deleteFailed'));
    }
  };

  const handleAbortTask = async taskId => {
    if (!confirm(t('tasks.confirmAbort'))) return;

    try {
      const response = await axios.patch(`/api/projects/${projectId}/tasks/${taskId}`, {
        status: 3,
        note: t('tasks.status.aborted')
      });

      if (response.data?.code === 0) {
        toast.success(t('tasks.abortSuccess'));
        fetchTasks();
      } else {
        toast.error(t('tasks.abortFailed'));
      }
    } catch (error) {
      console.error('Failed to abort task:', error);
      toast.error(t('tasks.abortFailed'));
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          pl: 2,
          pr: 2
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          <TaskIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('tasks.title')}
        </Typography>

        <TaskFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          loading={loading}
          onRefresh={fetchTasks}
        />
      </Box>

      {processingTasks.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('tasks.pending', { count: processingTasks.length })} - {completedProgressCount}/{totalProgressCount} ({overallProgress}%)
          </Typography>
          <LinearProgress variant="determinate" value={overallProgress} sx={{ height: 8, borderRadius: 4 }} />
        </Paper>
      )}

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
    </Container>
  );
}
