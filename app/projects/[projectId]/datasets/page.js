'use client';

import { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, CircularProgress, Card, useTheme, alpha, Paper, useMediaQuery } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import StorageIcon from '@mui/icons-material/Storage';
import { useRouter } from 'next/navigation';
import ExportDatasetDialog from '@/components/ExportDatasetDialog';
import ExportProgressDialog from '@/components/ExportProgressDialog';
import ImportDatasetDialog from '@/components/datasets/ImportDatasetDialog';
import { useTranslation } from 'react-i18next';
import DatasetList from './components/DatasetList';
import SearchBar from './components/SearchBar';
import ActionBar from './components/ActionBar';
import FilterDialog from './components/FilterDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import useDatasetExport from './hooks/useDatasetExport';
import useDatasetEvaluation from './hooks/useDatasetEvaluation';
import useDatasetFilters from './hooks/useDatasetFilters';
import { processInParallel } from '@/lib/util/async';
import axios from 'axios';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

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
  const [exportDialog, setExportDialog] = useState({ open: false });
  const [importDialog, setImportDialog] = useState({ open: false });
  const [selectedIds, setselectedIds] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const { t } = useTranslation();

  // 使用 useDatasetFilters Hook 管理筛选条件
  const {
    filterConfirmed,
    setFilterConfirmed,
    filterHasCot,
    setFilterHasCot,
    filterIsDistill,
    setFilterIsDistill,
    filterScoreRange,
    setFilterScoreRange,
    filterCustomTag,
    setFilterCustomTag,
    filterNoteKeyword,
    setFilterNoteKeyword,
    filterChunkName,
    setFilterChunkName,
    searchQuery,
    setSearchQuery,
    searchField,
    setSearchField,
    isInitialized,
    getActiveFilterCount
  } = useDatasetFilters(projectId);

  const debouncedSearchQuery = useDebounce(searchQuery);
  // 删除进度状态
  const [deleteProgress, setDeteleProgress] = useState({
    total: 0, // 总删除问题数量
    completed: 0, // 已删除完成的数量
    percentage: 0 // 进度百分比
  });
  // 导出进度状态
  const [exportProgress, setExportProgress] = useState({
    show: false, // 是否显示进度
    processed: 0, // 已处理数量
    total: 0, // 总数量
    hasMore: true // 是否还有更多数据
  });

  // 3. 添加打开导出对话框的处理函数
  const handleOpenExportDialog = () => {
    setExportDialog({ open: true });
  };

  // 4. 添加关闭导出对话框的处理函数
  const handleCloseExportDialog = () => {
    setExportDialog({ open: false });
  };

  // 5. 添加打开导入对话框的处理函数
  const handleOpenImportDialog = () => {
    setImportDialog({ open: true });
  };

  // 6. 添加关闭导入对话框的处理函数
  const handleCloseImportDialog = () => {
    setImportDialog({ open: false });
  };

  // 7. 导入成功后的处理函数
  const handleImportSuccess = () => {
    // 刷新数据集列表
    getDatasetsList();
    toast.success(t('import.importSuccess', '数据集导入成功'));
  };

  // 获取数据集列表
  const getDatasetsList = async () => {
    try {
      setLoading(true);
      let url = `/api/projects/${projectId}/datasets?page=${page}&size=${rowsPerPage}`;

      if (filterConfirmed !== 'all') {
        url += `&status=${filterConfirmed}`;
      }

      if (searchQuery) {
        url += `&input=${encodeURIComponent(searchQuery)}&field=${searchField}`;
      }

      if (filterHasCot !== 'all') {
        url += `&hasCot=${filterHasCot}`;
      }

      if (filterIsDistill !== 'all') {
        url += `&isDistill=${filterIsDistill}`;
      }

      if (filterScoreRange[0] > 0 || filterScoreRange[1] < 5) {
        url += `&scoreRange=${filterScoreRange[0]}-${filterScoreRange[1]}`;
      }

      if (filterCustomTag) {
        url += `&customTag=${encodeURIComponent(filterCustomTag)}`;
      }

      if (filterNoteKeyword) {
        url += `&noteKeyword=${encodeURIComponent(filterNoteKeyword)}`;
      }

      if (filterChunkName) {
        url += `&chunkName=${encodeURIComponent(filterChunkName)}`;
      }

      const response = await axios.get(url);
      setDatasets(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    getDatasetsList();
    // 获取项目中所有使用过的标签
    const fetchAvailableTags = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/datasets/tags`);
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    fetchAvailableTags();
  }, [projectId, page, rowsPerPage, debouncedSearchQuery, searchField, isInitialized]);

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
  const { exportDatasets, exportDatasetsStreaming } = useDatasetExport(projectId);

  // 使用自定义 Hook 处理数据集评估逻辑
  const { evaluatingIds, batchEvaluating, handleEvaluateDataset, handleBatchEvaluate } = useDatasetEvaluation(
    projectId,
    getDatasetsList
  );

  // 处理导出数据集 - 智能选择导出方式
  const handleExportDatasets = async exportOptions => {
    try {
      // 如果是平衡导出，则忽略选中项，按 balanceConfig 导出
      const exportOptionsWithSelection = exportOptions.balanceMode
        ? { ...exportOptions }
        : { ...exportOptions, ...(selectedIds.length > 0 && { selectedIds }) };

      // 获取数据总量：
      // 平衡导出时，按 balanceConfig 的总量计算；
      // 其他情况：如果有选中数据集则使用选中数量，否则使用当前筛选条件下的数据总量
      const balancedTotal = Array.isArray(exportOptions.balanceConfig)
        ? exportOptions.balanceConfig.reduce((sum, c) => sum + (parseInt(c.maxCount) || 0), 0)
        : 0;
      const totalCount = exportOptions.balanceMode
        ? balancedTotal
        : selectedIds.length > 0
          ? selectedIds.length
          : datasets.total || 0;

      // 设置阈值：超过1000条数据使用流式导出
      const STREAMING_THRESHOLD = 1000;

      // 检查是否需要包含文本块内容
      const needsChunkContent = exportOptions.formatType === 'custom' && exportOptions.customFields?.includeChunk;

      let success = false;

      // 如果数据量大于阈值或需要查询文本块内容，使用流式导出
      if (totalCount > STREAMING_THRESHOLD || needsChunkContent) {
        // 使用流式导出，显示进度
        setExportProgress({ show: true, processed: 0, total: totalCount });

        success = await exportDatasetsStreaming(exportOptionsWithSelection, progress => {
          setExportProgress(prev => ({
            ...prev,
            processed: progress.processed,
            hasMore: progress.hasMore
          }));
        });

        // 隐藏进度
        setExportProgress({ show: false, processed: 0, total: 0 });
      } else {
        // 使用传统导出方式
        success = await exportDatasets(exportOptionsWithSelection);
      }

      if (success) {
        // 关闭export对话框
        handleCloseExportDialog();
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress({ show: false, processed: 0, total: 0 });
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
      let url = `/api/projects/${projectId}/datasets?selectedAll=1`;

      if (filterConfirmed !== 'all') {
        url += `&status=${filterConfirmed}`;
      }

      if (debouncedSearchQuery) {
        url += `&input=${encodeURIComponent(debouncedSearchQuery)}&field=${searchField}`;
      }

      if (filterHasCot !== 'all') {
        url += `&hasCot=${filterHasCot}`;
      }

      if (filterIsDistill !== 'all') {
        url += `&isDistill=${filterIsDistill}`;
      }

      if (filterScoreRange[0] > 0 || filterScoreRange[1] < 5) {
        url += `&scoreRange=${filterScoreRange[0]}-${filterScoreRange[1]}`;
      }

      if (filterCustomTag) {
        url += `&customTag=${encodeURIComponent(filterCustomTag)}`;
      }

      if (filterNoteKeyword) {
        url += `&noteKeyword=${encodeURIComponent(filterNoteKeyword)}`;
      }

      const response = await axios.get(url);
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

  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <main style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: theme.palette.background.default,
        minHeight: '100vh'
      }}>
        <Container maxWidth="xl" sx={{ 
          mt: 4, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            {t('datasets.loading')}
          </Typography>
        </Container>
      </main>
    );
  }

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
            <StorageIcon
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
              {t('datasets.title', { defaultValue: '数据集管理' })}
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
              mb: 4,
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
          <SearchBar
            searchQuery={searchQuery}
            searchField={searchField}
            onSearchQueryChange={value => {
              setSearchQuery(value);
              setPage(1);
            }}
            onSearchFieldChange={value => {
              setSearchField(value);
              setPage(1);
            }}
            onMoreFiltersClick={() => setFilterDialogOpen(true)}
            activeFilterCount={getActiveFilterCount()}
          />
          <ActionBar
            batchEvaluating={batchEvaluating}
            onBatchEvaluate={handleBatchEvaluate}
            onImport={handleOpenImportDialog}
            onExport={handleOpenExportDialog}
          />
        </Box>
          </Paper>
          {selectedIds.length ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginTop: '10px',
                gap: 2,
                mb: 3
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
          ) : null}

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
            <DatasetList
              datasets={datasets.data}
              onViewDetails={handleViewDetails}
              onDelete={handleOpenDeleteDialog}
              onEvaluate={handleEvaluateDataset}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              total={datasets.total}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              evaluatingIds={evaluatingIds}
            />
          </Paper>

          <DeleteConfirmDialog
            open={deleteDialog.open}
            datasets={deleteDialog.datasets || []}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDeleteConfirm}
            batch={deleteDialog.batch}
            progress={deleteProgress}
            deleting={deleteDialog.deleting}
          />

          <FilterDialog
            open={filterDialogOpen}
            onClose={() => setFilterDialogOpen(false)}
            filterConfirmed={filterConfirmed}
            filterHasCot={filterHasCot}
            filterIsDistill={filterIsDistill}
            filterScoreRange={filterScoreRange}
            filterCustomTag={filterCustomTag}
            filterNoteKeyword={filterNoteKeyword}
            filterChunkName={filterChunkName}
            availableTags={availableTags}
            onFilterConfirmedChange={setFilterConfirmed}
            onFilterHasCotChange={setFilterHasCot}
            onFilterIsDistillChange={setFilterIsDistill}
            onFilterScoreRangeChange={setFilterScoreRange}
            onFilterCustomTagChange={setFilterCustomTag}
            onFilterNoteKeywordChange={setFilterNoteKeyword}
            onFilterChunkNameChange={setFilterChunkName}
            onResetFilters={() => {
              setFilterConfirmed('all');
              setFilterHasCot('all');
              setFilterIsDistill('all');
              setFilterScoreRange([0, 5]);
              setFilterCustomTag('');
              setFilterNoteKeyword('');
              setFilterChunkName('');
              getDatasetsList();
            }}
            onApplyFilters={() => {
              setFilterDialogOpen(false);
              setPage(1);
              getDatasetsList();
            }}
          />

          <ExportDatasetDialog
            open={exportDialog.open}
            onClose={handleCloseExportDialog}
            onExport={handleExportDatasets}
            projectId={projectId}
          />

          <ImportDatasetDialog
            open={importDialog.open}
            onClose={handleCloseImportDialog}
            onImportSuccess={handleImportSuccess}
            projectId={projectId}
          />

          {/* 导出进度对话框 */}
          <ExportProgressDialog open={exportProgress.show} progress={exportProgress} />
        </motion.div>
      </Container>
    </main>
  );
}
