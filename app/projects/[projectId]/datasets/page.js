'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  useTheme,
  alpha,
  InputBase,
  LinearProgress,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useRouter } from 'next/navigation';
import ExportDatasetDialog from '@/components/ExportDatasetDialog';
import { useTranslation } from 'react-i18next';
import DatasetList from './components/DatasetList';
import useDatasetExport from './hooks/useDatasetExport';
import { processInParallel } from '@/lib/util/async';
import axios from 'axios';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

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
                {t('datasets.batchDeleteProgress', {
                  completed: progress.completed,
                  total: progress.total
                })}
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
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    datasets: null,
    batch: false,
    deleting: false
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery);
  const [searchField, setSearchField] = useState('question'); // 新增：筛选字段，默认为问题
  const [exportDialog, setExportDialog] = useState({ open: false });
  const [selectedIds, setselectedIds] = useState([]);
  const [filterConfirmed, setFilterConfirmed] = useState('all');
  const [filterHasCot, setFilterHasCot] = useState('all');
  const [filterValidation, setFilterValidation] = useState('all');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
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
  const getDatasetsList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/projects/${projectId}/datasets?page=${page}&size=${rowsPerPage}&status=${filterConfirmed}&input=${searchQuery}&field=${searchField}&hasCot=${filterHasCot}&validation=${filterValidation}`
      );
      setDatasets(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDatasetsList();
  }, [projectId, page, rowsPerPage, filterConfirmed, debouncedSearchQuery, searchField, filterHasCot]);

  // 处理页码变化
  const handlePageChange = (event, newPage) => {
    // MUI TablePagination 的页码从 0 开始，而我们的 API 从 1 开始
    setPage(newPage + 1);
  };

  // 处理每页行数变化
  const handleRowsPerPageChange = event => {
    setPage(1);
    setRowsPerPage(parseInt(event.target.value, 10));
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
    const datasetsArray = selectedIds.map(id => ({ id }));
    setDeleteDialog({
      open: true,
      datasets: datasetsArray,
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
    setselectedIds([]);
    // 刷新数据
    getDatasetsList();
    // 关闭确认框
    handleCloseDeleteDialog();
  };

  // 批量删除数据集
  const handleBatchDelete = async () => {
    try {
      await processInParallel(
        selectedIds,
        async datasetId => {
          await fetch(`/api/projects/${projectId}/datasets?id=${datasetId}`, {
            method: 'DELETE'
          });
        },
        3,
        (cur, total) => {
          setDeteleProgress({
            total,
            completed: cur,
            percentage: Math.floor((cur / total) * 100)
          });
        }
      );

      toast.success(t('common.deleteSuccess'));
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error(error.message || t('common.deleteFailed'));
    }
  };

  // 删除数据集
  const handleDelete = async dataset => {
    try {
      const response = await fetch(`/api/projects/${projectId}/datasets?id=${dataset.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(t('datasets.deleteFailed'));

      toast.success(t('datasets.deleteSuccess'));
    } catch (error) {
      toast.error(error.message || t('datasets.deleteFailed'));
    }
  };

  // 使用自定义 Hook 处理数据集导出逻辑
  const { exportDatasets } = useDatasetExport(projectId);

  // 处理导出数据集
  const handleExportDatasets = async exportOptions => {
    const success = await exportDatasets(exportOptions);
    if (success) {
      // 关闭导出对话框
      handleCloseExportDialog();
    }
  };

  // 查看详情
  const handleViewDetails = id => {
    router.push(`/projects/${projectId}/datasets/${id}`);
  };

  // 处理全选/取消全选
  const handleSelectAll = async event => {
    if (event.target.checked) {
      // 获取所有符合当前筛选条件的数据，不受分页限制
      const response = await axios.get(
        `/api/projects/${projectId}/datasets?status=${filterConfirmed}&input=${searchQuery}&selectedAll=1`
      );
      setselectedIds(response.data.map(dataset => dataset.id));
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
                total: datasets.total,
                confirmed: datasets.confirmedCount,
                percentage: datasets.total > 0 ? ((datasets.confirmedCount / datasets.total) * 100).toFixed(2) : 0
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
                width: 400,
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
                  setPage(1);
                }}
                endAdornment={
                  <Select
                    value={searchField}
                    onChange={e => {
                      setSearchField(e.target.value);
                      setPage(1);
                    }}
                    variant="standard"
                    sx={{
                      minWidth: 90,
                      '& .MuiInput-underline:before': { borderBottom: 'none' },
                      '& .MuiInput-underline:after': { borderBottom: 'none' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                    }}
                    disableUnderline
                  >
                    <MenuItem value="question">{t('datasets.fieldQuestion')}</MenuItem>
                    <MenuItem value="answer">{t('datasets.fieldAnswer')}</MenuItem>
                    <MenuItem value="cot">{t('datasets.fieldCOT')}</MenuItem>
                    <MenuItem value="questionLabel">{t('datasets.fieldLabel')}</MenuItem>
                  </Select>
                }
              />
            </Paper>
            <Button
              variant="outlined"
              onClick={() => setFilterDialogOpen(true)}
              startIcon={<FilterListIcon />}
              sx={{ borderRadius: 2 }}
            >
              {t('datasets.moreFilters')}
            </Button>
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
        datasets={datasets.data}
        onViewDetails={handleViewDetails}
        onDelete={handleOpenDeleteDialog}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        total={datasets.total}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectItem}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        datasets={deleteDialog.datasets || []}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        batch={deleteDialog.batch}
        progress={deleteProgress}
        deleting={deleteDialog.deleting}
      />

      {/* 更多筛选对话框 */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('datasets.filtersTitle')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('datasets.filterConfirmationStatus')}
            </Typography>
            <Select
              value={filterConfirmed}
              onChange={e => setFilterConfirmed(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            >
              <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
              <MenuItem value="confirmed">{t('datasets.filterConfirmed')}</MenuItem>
              <MenuItem value="unconfirmed">{t('datasets.filterUnconfirmed')}</MenuItem>
            </Select>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('datasets.filterCotStatus')}
            </Typography>
            <Select
              value={filterHasCot}
              onChange={e => setFilterHasCot(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            >
              <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
              <MenuItem value="yes">{t('datasets.filterHasCot')}</MenuItem>
              <MenuItem value="no">{t('datasets.filterNoCot')}</MenuItem>
            </Select>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('datasets.filterValidationStatus')}
            </Typography>
            <Select
              value={filterValidation}
              onChange={e => setFilterValidation(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            >
              <MenuItem value="all">{t('datasets.filterAll')}</MenuItem>
              <MenuItem value="verified">{t('datasets.statusVerified')}</MenuItem>
              <MenuItem value="partially_verified">{t('datasets.statusPartiallyVerified')}</MenuItem>
              <MenuItem value="suspicious">{t('datasets.statusSuspicious')}</MenuItem>
              <MenuItem value="unverified">{t('datasets.statusUnverified')}</MenuItem>
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFilterConfirmed('all');
              setFilterHasCot('all');
              setFilterValidation('all');
              getDatasetsList();
            }}
          >
            {t('datasets.resetFilters')}
          </Button>
          <Button
            onClick={() => {
              setFilterDialogOpen(false);
              setPage(1); // 重置到第一页
              getDatasetsList();
            }}
            variant="contained"
          >
            {t('datasets.applyFilters')}
          </Button>
        </DialogActions>
      </Dialog>

      <ExportDatasetDialog
        open={exportDialog.open}
        onClose={handleCloseExportDialog}
        onExport={handleExportDatasets}
        projectId={projectId}
      />
    </Container>
  );
}
