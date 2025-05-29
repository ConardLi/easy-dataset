'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import TaskIcon from '@mui/icons-material/Task';
import { toast } from 'sonner';

// 导入任务管理组件
import TaskFilters from '@/components/tasks/TaskFilters';
import TasksTable from '@/components/tasks/TasksTable';

/**
 * 任务管理页面
 * 支持任务列表查看、筛选、中断和删除操作
 * 分页展示、国际化支持
 */

// 任务状态映射
const TASK_STATUS = {
  0: { label: '处理中', color: 'warning' },
  1: { label: '已完成', color: 'success' },
  2: { label: '失败', color: 'error' },
  3: { label: '已中断', color: 'default' }
};

// 任务类型映射
const TASK_TYPES = {
  'text-processing': '文献处理',
  'question-generation': '问题生成',
  'answer-generation': '答案生成',
  'data-distillation': '数据蒸馏',
  'pdf-processing': 'PDF解析'
};

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

      {/* 任务表格组件 */}
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
