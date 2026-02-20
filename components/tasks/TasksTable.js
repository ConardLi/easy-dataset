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
  TablePagination,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

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

  const formatDate = dateString => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: i18n.language === 'zh-CN' ? zhCN : enUS
    });
  };

  const calculateDuration = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return '-';

    try {
      const startTime = new Date(startTimeStr);
      const endTime = new Date(endTimeStr);
      const duration = endTime - startTime;
      const seconds = Math.floor(duration / 1000);

      if (seconds < 60) {
        return t('tasks.duration.seconds', { seconds });
      }
      if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return t('tasks.duration.minutes', { minutes, seconds: remainingSeconds });
      }

      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return t('tasks.duration.hours', { hours, minutes: remainingMinutes });
    } catch (error) {
      console.error('Failed to calculate duration:', error);
      return '-';
    }
  };

  const parseModelInfo = modelInfoString => {
    let modelInfo = '';
    try {
      const parsedModel = JSON.parse(modelInfoString);
      modelInfo = parsedModel.modelName || parsedModel.name || '-';
    } catch {
      modelInfo = modelInfoString || '-';
    }
    return modelInfo;
  };

  const toTaskTypeLabel = taskType => {
    if (!taskType) return '-';
    return String(taskType)
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getLocalizedTaskType = taskType => {
    return t(`tasks.types.${taskType}`, { defaultValue: toTaskTypeLabel(taskType) });
  };

  const parseJsonSafely = input => {
    if (!input || typeof input !== 'string') return null;
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  };

  const formatTaskNote = task => {
    const note = String(task?.note || '').trim();
    if (!note) return '-';

    const noteJson = parseJsonSafely(note);
    if (noteJson) {
      if (Array.isArray(noteJson.chunkIds)) {
        return t('tasks.notes.selectedChunks', { count: noteJson.chunkIds.length });
      }
      if (Array.isArray(noteJson.fileList)) {
        return t('tasks.notes.fileBatch', {
          count: noteJson.fileList.length,
          strategy: noteJson.strategy || '-'
        });
      }
      return t('tasks.notes.jsonParams');
    }

    if (note === 'No chunks require question generation' || note.startsWith('No chunks require question gen')) {
      return t('tasks.notes.noChunksQuestion');
    }
    if (note === 'No chunks require cleaning' || note.startsWith('No chunks require clean')) {
      return t('tasks.notes.noChunksCleaning');
    }
    if (note.startsWith('Processing failed:')) {
      return t('tasks.notes.processingFailed', {
        error: note.replace('Processing failed:', '').trim()
      });
    }

    const summaryMatch = note.match(/Processed:\s*(\d+)\/(\d+),\s*succeeded:\s*(\d+),\s*failed:\s*(\d+)/i);
    if (summaryMatch) {
      const [, processed, total, succeeded, failed] = summaryMatch;

      const questionMatch = note.match(/questions generated:\s*(\d+)/i);
      if (questionMatch) {
        return t('tasks.notes.questionSummary', {
          processed,
          total,
          succeeded,
          failed,
          generated: questionMatch[1]
        });
      }

      const datasetMatch = note.match(/datasets generated:\s*(\d+)/i);
      if (datasetMatch) {
        return t('tasks.notes.datasetSummary', {
          processed,
          total,
          succeeded,
          failed,
          generated: datasetMatch[1]
        });
      }

      const cleaningMatch = note.match(/total original length:\s*(\d+),\s*total cleaned length:\s*(\d+)/i);
      if (cleaningMatch) {
        return t('tasks.notes.cleaningSummary', {
          processed,
          total,
          succeeded,
          failed,
          original: cleaningMatch[1],
          cleaned: cleaningMatch[2]
        });
      }

      return t('tasks.notes.genericSummary', {
        processed,
        total,
        succeeded,
        failed
      });
    }

    return note;
  };

  const truncateNote = (note, maxLength = 48) => {
    if (!note) return '-';
    if (note.length <= maxLength) return note;
    return `${note.substring(0, maxLength)}...`;
  };

  return (
    <React.Fragment>
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('tasks.table.type')}</TableCell>
              <TableCell>{t('tasks.table.status')}</TableCell>
              <TableCell>{t('tasks.table.progress')}</TableCell>
              <TableCell>{t('tasks.table.createTime')}</TableCell>
              <TableCell>{t('tasks.table.duration')}</TableCell>
              <TableCell>{t('tasks.table.model')}</TableCell>
              <TableCell>{t('tasks.table.note')}</TableCell>
              <TableCell align="right">{t('tasks.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
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
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1">{t('tasks.empty')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map(task => {
                const noteText = formatTaskNote(task);
                return (
                  <TableRow key={task.id}>
                    <TableCell>{getLocalizedTaskType(task.taskType)}</TableCell>
                    <TableCell>
                      <TaskStatusChip status={task.status} />
                    </TableCell>
                    <TableCell>
                      <TaskProgress task={task} />
                    </TableCell>

                    <TableCell>{formatDate(task.createAt)}</TableCell>
                    <TableCell>{task.endTime ? calculateDuration(task.startTime, task.endTime) : '-'}</TableCell>
                    <TableCell>{parseModelInfo(task.modelInfo)}</TableCell>
                    <TableCell>
                      {noteText !== '-' ? (
                        <Tooltip title={noteText} arrow placement="top">
                          <Typography
                            variant="body2"
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            {truncateNote(noteText)}
                          </Typography>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TaskActions task={task} onAbort={handleAbortTask} onDelete={handleDeleteTask} />
                    </TableCell>
                  </TableRow>
                );
              })
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
          labelDisplayedRows={({ count }) => {
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
