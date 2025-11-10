'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  TablePagination
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

// 导入子组件
import TaskStatusChip from './TaskStatusChip';
import TaskProgress from './TaskProgress';
import TaskActions from './TaskActions';

export default function TasksTable({
  tasks,
  loading,
  handleAbortTask,
  handleDeleteTask,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  totalCount
}) {
  const { t, i18n } = useTranslation();

  // 格式化日期
  const formatDate = dateString => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: i18n.language === 'zh-CN' ? zhCN : enUS
    });
  };

  // 计算任务运行时间
  const calculateDuration = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return '-';

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(endTimeStr);

      // 计算时间差（毫秒）
      const duration = endTime - startTime;

      // 将毫秒转换为人类可读格式
      const seconds = Math.floor(duration / 1000);

      if (seconds < 60) {
        return t('tasks.duration.seconds', { seconds });
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return t('tasks.duration.minutes', { minutes, seconds: remainingSeconds });
      } else {
        const hours = Math.floor(seconds / 3600);
        const remainingMinutes = Math.floor((seconds % 3600) / 60);
        return t('tasks.duration.hours', { hours, minutes: remainingMinutes });
      }
    } catch (error) {
      console.error('计算运行时间出错:', error);
      return '-';
    }
  };

  // 解析模型信息
  const parseModelInfo = modelInfoString => {
    let modelInfo = '';
    try {
      const parsedModel = JSON.parse(modelInfoString);
      modelInfo = parsedModel.modelName || parsedModel.name || '-';
    } catch (error) {
      modelInfo = modelInfoString || '-';
    }
    return modelInfo;
  };

  // 任务类型本地化
  const getLocalizedTaskType = taskType => {
    return t(`tasks.types.${taskType}`, { defaultValue: taskType });
  };

  return (
    <React.Fragment>
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, mb: 2 }}>
        <Table
          sx={{
            '& tbody tr': {
              transition: 'background-color 0.2s ease',
            },
            '& tbody tr:hover': {
              backgroundColor: theme => theme.palette.mode === 'dark'
                ? 'rgba(99, 102, 241, 0.06)'
                : 'rgba(99, 102, 241, 0.04)'
            },
            '& tbody .MuiTableCell-root': {
              borderBottom: theme => theme.palette.mode === 'dark'
                ? '1px dashed rgba(99, 102, 241, 0.18)'
                : '1px solid rgba(226, 232, 240, 0.8)'
            }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>{t('tasks.table.type')}</TableCell>
              <TableCell>{t('tasks.table.status')}</TableCell>
              <TableCell>{t('tasks.table.progress')}</TableCell>
              <TableCell>{t('tasks.table.success')}</TableCell>
              <TableCell>{t('tasks.table.failed')}</TableCell>
              <TableCell>{t('tasks.table.createTime')}</TableCell>
              <TableCell>{t('tasks.table.duration')}</TableCell>
              <TableCell>{t('tasks.table.model')}</TableCell>
              <TableCell align="right">{t('tasks.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {t('tasks.loading')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1">{t('tasks.empty')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell>{getLocalizedTaskType(task.taskType)}</TableCell>
                  <TableCell>
                    <TaskStatusChip status={task.status} />
                  </TableCell>
                  <TableCell>
                    <TaskProgress task={task} />
                  </TableCell>
                  <TableCell>{task.completedCount ? task.completedCount - (task.errorCount || 0) : 0}</TableCell>
                  <TableCell>{task.errorCount || 0}</TableCell>
                  <TableCell>{formatDate(task.createAt)}</TableCell>
                  <TableCell>{task.endTime ? calculateDuration(task.startTime, task.endTime) : '-'}</TableCell>
                  <TableCell>{parseModelInfo(task.modelInfo)}</TableCell>
                  <TableCell align="right">
                    <TaskActions task={task} onAbort={handleAbortTask} onDelete={handleDeleteTask} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {tasks.length > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage={t('datasets.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => {
            // 根据实际分页操作计算正确的from和to
            const calculatedFrom = page * rowsPerPage + 1;
            const calculatedTo = Math.min((page + 1) * rowsPerPage, count);
            return t('datasets.pagination', {
              from: calculatedFrom,
              to: calculatedTo,
              count
            });
          }}
        />
      )}
    </React.Fragment>
  );
}
