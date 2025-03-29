'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Card,
  Divider,
  useTheme,
  alpha,
  InputBase,
  Tooltip,
  Checkbox,
  LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useRouter } from 'next/navigation';
import ExportDatasetDialog from '@/components/ExportDatasetDialog';
import { useTranslation } from 'react-i18next';
import { processInParallel } from '@/lib/util/async';

// 数据集列表组件
const DatasetList = ({
  datasets,
  onViewDetails,
  onDelete,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  total,
  selectedIds,
  onSelectAll,
  onSelectItem
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const bgColor = theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light;
  const color =
    theme.palette.mode === 'dark'
      ? theme.palette.getContrastText(theme.palette.primary.main)
      : theme.palette.getContrastText(theme.palette.primary.contrastText);

  return (
    <Card elevation={2}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                <Checkbox
                  color="primary"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < datasets.length}
                  checked={datasets.length > 0 && selectedIds.length === datasets.length}
                  onChange={onSelectAll}
                />
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('datasets.question')}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('datasets.createdAt')}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('datasets.model')}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('datasets.domainTag')}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('datasets.cot')}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('datasets.answer')}
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'bold',
                  padding: '16px 8px',
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {t('common.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((dataset, index) => (
              <TableRow
                key={dataset.id}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.light, 0.05) },
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.light, 0.1) },
                  cursor: 'pointer'
                }}
                onClick={() => onViewDetails(dataset.id)}
              >
                <TableCell
                  padding="checkbox"
                  sx={{
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}
                >
                  <Checkbox
                    color="primary"
                    checked={selectedIds.includes(dataset.id)}
                    onChange={e => {
                      e.stopPropagation();
                      onSelectItem(dataset.id);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 300,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    py: 2
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {dataset.confirmed && (
                      <Chip
                        label={t('datasets.confirmed')}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.dark,
                          fontWeight: 'medium',
                          verticalAlign: 'baseline',
                          marginRight: '2px'
                        }}
                      />
                    )}
                    {dataset.question}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(dataset.createdAt).toLocaleString('zh-CN')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={dataset.model}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.dark,
                      fontWeight: 'medium'
                    }}
                  />
                </TableCell>
                <TableCell>
                  {dataset.questionLabel ? (
                    <Chip
                      label={dataset.questionLabel}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.dark,
                        fontWeight: 'medium'
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      {t('datasets.noTag')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={dataset.cot ? t('common.yes') : t('common.no')}
                    size="small"
                    sx={{
                      backgroundColor: dataset.cot
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.grey[500], 0.1),
                      color: dataset.cot ? theme.palette.success.dark : theme.palette.grey[700],
                      fontWeight: 'medium'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {dataset.answer}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 120 }}>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title={t('datasets.viewDetails')}>
                      <IconButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          onViewDetails(dataset.id);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          onDelete(dataset);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('datasets.noData')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Divider />
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage={t('datasets.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => t('datasets.pagination', { from, to, count })}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontWeight: 'medium'
          }
        }}
      />
    </Card>
  );
};

// 删除确认对话框
const DeleteConfirmDialog = ({ open, datasets, onClose, onConfirm, batch, progress, deleting }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dataset = datasets?.[0];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          {t('common.confirmDelete')}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 2, pt: 1 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {batch
            ? t('datasets.batchconfirmDeleteMessage', {
                count: datasets.length
              })
            : t('common.confirmDeleteDataSet')}
        </Typography>
        {batch ? (
          ''
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: alpha(theme.palette.warning.light, 0.1),
              borderColor: theme.palette.warning.light
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
              {t('datasets.question')}：
            </Typography>
            <Typography variant="body2">{dataset?.question}</Typography>
          </Paper>
        )}
        {deleting && progress ? (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                {progress.percentage}%
              </Typography>
              <Box sx={{ width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={progress.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      transitionDuration: '0.1s'
                    }
                  }}
                  color="primary"
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="body2">
                {t('datasets.batchDeleteProgress', { completed: progress.completed, total: progress.total })}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                {t('datasets.batchDeleteCount', { count: progress.datasetCount })}
              </Typography>
            </Box>
          </Box>
        ) : (
          ''
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" sx={{ borderRadius: 2 }}>
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 主页面组件
export default function DatasetsPage({ params }) {
  const { projectId } = params;
  const router = useRouter();
  const theme = useTheme();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    datasets: null,
    // 是否批量删除
    batch: false,
    // 是否正在删除
    deleting: false
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportDialog, setExportDialog] = useState({ open: false });
  const [selectedIds, setselectedIds] = useState([]);
  const { t } = useTranslation();
  // 删除进度状态
  const [deleteProgress, setDeteleProgress] = useState({
    total: 0, // 总删除问题数量
    completed: 0, // 已删除完成的数量
    percentage: 0 // 进度百分比
  });

  // 3. 添加打开导出对话框的处理函数
  const handleOpenExportDialog = () => {
    setExportDialog({ open: true });
  };

  // 4. 添加关闭导出对话框的处理函数
  const handleCloseExportDialog = () => {
    setExportDialog({ open: false });
  };

  // 获取数据集列表
  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/datasets`);
      if (!response.ok) throw new Error(t('datasets.fetchFailed'));
      const data = await response.json();
      setDatasets(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [projectId]);

  // 处理页码变化
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // 处理每页行数变化
  const handleRowsPerPageChange = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 过滤数据
  const filteredDatasets = datasets.filter(
    dataset =>
      dataset.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dataset.questionLabel && dataset.questionLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dataset.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取当前页的数据
  const getCurrentPageData = () => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredDatasets.slice(start, end);
  };

  // 打开删除确认框
  const handleOpenDeleteDialog = dataset => {
    setDeleteDialog({
      open: true,
      datasets: [dataset]
    });
  };

  // 关闭删除确认框
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      dataset: null
    });
  };

  const handleBatchDeleteDataset = async () => {
    setDeleteDialog({
      open: true,
      datasets: datasets.filter(dataset => selectedIds.includes(dataset.id)),
      batch: true,
      count: selectedIds.length
    });
  };

  const resetProgress = () => {
    setDeteleProgress({
      total: deleteDialog.count,
      completed: 0,
      percentage: 0
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.batch) {
      setDeleteDialog({
        ...deleteDialog,
        deleting: true
      });
      await handleBatchDelete();
      resetProgress();
    } else {
      const [dataset] = deleteDialog.datasets;
      if (!dataset) return;
      await handleDelete(dataset);
    }
    // 刷新数据
    fetchDatasets();
    // 关闭确认框
    handleCloseDeleteDialog();
  };

  // 批量删除数据集
  const handleBatchDelete = async () => {
    // TODO: 并发删除存在问题，这里只能同时删除1个，待优化
    await processInParallel(deleteDialog.datasets, handleDelete, 1, (cur, total) => {
      setDeteleProgress({
        total: total,
        completed: cur,
        percentage: Math.floor((cur / total) * 100)
      });
    });
  };

  // 删除数据集
  const handleDelete = async dataset => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets?id=${dataset.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(t('datasets.deleteFailed'));

      setSnackbar({
        open: true,
        message: t('datasets.deleteSuccess'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  // 导出数据集
  const handleExportDatasets = exportOptions => {
    try {
      // 根据选项筛选数据
      let dataToExport = [...filteredDatasets];

      // 如果只导出已确认的数据集
      if (exportOptions.confirmedOnly) {
        dataToExport = dataToExport.filter(dataset => dataset.confirmed);
      }

      // 根据选择的格式转换数据
      let formattedData;

      if (exportOptions.formatType === 'alpaca') {
        formattedData = dataToExport.map(({ question, answer, cot }) => ({
          instruction: question,
          input: '',
          output: cot && exportOptions.includeCOT ? `<think>${cot}</think>\n${answer}` : answer,
          system: exportOptions.systemPrompt || ''
        }));
      } else if (exportOptions.formatType === 'sharegpt') {
        formattedData = dataToExport.map(({ question, answer, cot }) => {
          const messages = [];

          // 添加系统提示词（如果有）
          if (exportOptions.systemPrompt) {
            messages.push({
              role: 'system',
              content: exportOptions.systemPrompt
            });
          }

          // 添加用户问题
          messages.push({
            role: 'user',
            content: question
          });

          // 添加助手回答
          messages.push({
            role: 'assistant',
            content: cot && exportOptions.includeCOT ? `<think>${cot}</think>\n${answer}` : answer
          });

          return { messages };
        });
      } else if (exportOptions.formatType === 'custom') {
        // 处理自定义格式
        const { questionField, answerField, cotField, includeLabels } = exportOptions.customFields;

        formattedData = dataToExport.map(({ question, answer, cot, questionLabel: labels }) => {
          const item = {
            [questionField]: question,
            [answerField]: answer
          };

          // 如果有思维链且用户选择包含思维链，则添加思维链字段
          if (cot && exportOptions.includeCOT && cotField) {
            item[cotField] = cot;
          }

          // 如果需要包含标签
          if (includeLabels && labels && labels.length > 0) {
            item.label = labels.split(' ')[1];
          }

          return item;
        });
      }

      // 处理不同的文件格式
      let content;
      let fileExtension;

      if (exportOptions.fileFormat === 'jsonl') {
        // JSONL 格式：每行一个 JSON 对象
        content = formattedData.map(item => JSON.stringify(item)).join('\n');
        fileExtension = 'jsonl';
      } else if (exportOptions.fileFormat === 'csv') {
        // CSV 格式
        const headers = Object.keys(formattedData[0] || {});
        const csvRows = [
          // 添加表头
          headers.join(','),
          // 添加数据行
          ...formattedData.map(item =>
            headers
              .map(header => {
                // 处理包含逗号、换行符或双引号的字段
                let field = item[header]?.toString() || '';
                if (field.includes(',') || field.includes('\n') || field.includes('"')) {
                  field = `"${field.replace(/"/g, '""')}"`;
                }
                return field;
              })
              .join(',')
          )
        ];
        content = csvRows.join('\n');
        fileExtension = 'csv';
      } else {
        // 默认 JSON 格式
        content = JSON.stringify(formattedData, null, 2);
        fileExtension = 'json';
      }

      // 创建 Blob 对象
      const blob = new Blob([content], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const formatSuffix = exportOptions.formatType === 'alpaca' ? 'alpaca' : 'sharegpt';
      a.download = `datasets-${projectId}-${formatSuffix}-${new Date().toISOString().slice(0, 10)}.${fileExtension}`;

      // 触发下载
      document.body.appendChild(a);
      a.click();

      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 关闭导出对话框
      handleCloseExportDialog();

      setSnackbar({
        open: true,
        message: '数据集导出成功',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '导出失败: ' + error.message,
        severity: 'error'
      });
    }
  };
  // 查看详情
  const handleViewDetails = id => {
    router.push(`/projects/${projectId}/datasets/${id}`);
  };

  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 处理全选/取消全选
  const handleSelectAll = event => {
    if (event.target.checked) {
      setselectedIds(getCurrentPageData().map(dataset => dataset.id));
    } else {
      setselectedIds([]);
    }
  };

  // 处理单个选择
  const handleSelectItem = id => {
    setselectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '70vh'
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {t('datasets.loading')}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Card
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: alpha(theme.palette.primary.light, 0.05),
          borderRadius: 2
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
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
              {t('datasets.management')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('datasets.stats', {
                total: datasets.length,
                confirmed: datasets.filter(d => d.confirmed).length,
                percentage:
                  datasets.length > 0
                    ? Math.round((datasets.filter(d => d.confirmed).length / datasets.length) * 100)
                    : 0
              })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper
              component="form"
              sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: 300,
                borderRadius: 2
              }}
            >
              <IconButton sx={{ p: '10px' }} aria-label="search">
                <SearchIcon />
              </IconButton>
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder={t('datasets.searchPlaceholder')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
              />
            </Paper>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              sx={{ borderRadius: 2 }}
              onClick={handleOpenExportDialog}
            >
              {t('export.title')}
            </Button>
          </Box>
        </Box>
      </Card>
      {selectedIds.length ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '10px',
            gap: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {t('datasets.selected', {
              count: selectedIds.length
            })}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ borderRadius: 2 }}
            onClick={handleBatchDeleteDataset}
          >
            {t('datasets.batchDelete')}
          </Button>
        </Box>
      ) : (
        ''
      )}

      <DatasetList
        datasets={getCurrentPageData()}
        onViewDetails={handleViewDetails}
        onDelete={handleOpenDeleteDialog}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        total={filteredDatasets.length}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectItem}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        batch={deleteDialog.batch}
        datasets={deleteDialog.datasets}
        progress={deleteProgress}
        deleting={deleteDialog.deleting}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ExportDatasetDialog
        open={exportDialog.open}
        onClose={handleCloseExportDialog}
        onExport={handleExportDatasets}
        projectId={projectId}
      />
    </Container>
  );
}
