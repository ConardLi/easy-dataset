'use client';

import { Container, Box, Typography, Alert, Snackbar, Paper } from '@mui/material';
import ChunkViewDialog from '@/components/text-split/ChunkViewDialog';
import DatasetHeader from '@/components/datasets/DatasetHeader';
import DatasetMetadata from '@/components/datasets/DatasetMetadata';
import EditableField from '@/components/datasets/EditableField';
import OptimizeDialog from '@/components/datasets/OptimizeDialog';
import useDatasetDetails from '@/app/projects/[projectId]/datasets/[datasetId]/useDatasetDetails';
import { useTranslation } from 'react-i18next';

/**
 * 数据集详情页面
 */
export default function DatasetDetailsPage({ params }) {
  const { projectId, datasetId } = params;

  const { t } = useTranslation();
  // 使用自定义Hook管理状态和逻辑
  const {
    currentDataset,
    loading,
    editingAnswer,
    editingCot,
    answerValue,
    cotValue,
    snackbar,
    confirming,
    optimizeDialog,
    viewDialogOpen,
    viewChunk,
    datasetsAllCount,
    datasetsConfirmCount,
    shortcutsEnabled,
    setShortcutsEnabled,
    setSnackbar,
    setAnswerValue,
    setCotValue,
    setEditingAnswer,
    setEditingCot,
    handleNavigate,
    handleConfirm,
    handleSave,
    handleDelete,
    handleOpenOptimizeDialog,
    handleCloseOptimizeDialog,
    handleOptimize,
    handleViewChunk,
    handleCloseViewDialog
  } = useDatasetDetails(projectId, datasetId);

  // 加载状态
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <Alert severity="info">{t('datasets.loadingDataset')}</Alert>
        </Box>
      </Container>
    );
  }

  // 无数据状态
  if (!currentDataset) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{t('datasets.datasetNotFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 顶部导航栏 */}
      <DatasetHeader
        projectId={projectId}
        datasetsAllCount={datasetsAllCount}
        datasetsConfirmCount={datasetsConfirmCount}
        confirming={confirming}
        currentDataset={currentDataset}
        shortcutsEnabled={shortcutsEnabled}
        setShortcutsEnabled={setShortcutsEnabled}
        onNavigate={handleNavigate}
        onConfirm={handleConfirm}
        onDelete={handleDelete}
      />

      {/* 主要内容 */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            {t('datasets.question')}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {currentDataset.question}
          </Typography>
        </Box>

        <EditableField
          label={t('datasets.answer')}
          value={answerValue}
          editing={editingAnswer}
          onEdit={() => setEditingAnswer(true)}
          onChange={e => setAnswerValue(e.target.value)}
          onSave={() => handleSave('answer', answerValue)}
          onCancel={() => {
            setEditingAnswer(false);
            setAnswerValue(currentDataset.answer);
          }}
          onOptimize={handleOpenOptimizeDialog}
        />

        <EditableField
          label={t('datasets.cot')}
          value={cotValue}
          editing={editingCot}
          onEdit={() => setEditingCot(true)}
          onChange={e => setCotValue(e.target.value)}
          onSave={() => handleSave('cot', cotValue)}
          onCancel={() => {
            setEditingCot(false);
            setCotValue(currentDataset.cot || '');
          }}
        />

        <DatasetMetadata currentDataset={currentDataset} onViewChunk={handleViewChunk} />
      </Paper>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* AI优化对话框 */}
      <OptimizeDialog
        open={optimizeDialog.open}
        onClose={handleCloseOptimizeDialog}
        onConfirm={handleOptimize}
        loading={optimizeDialog.loading}
      />

      {/* 文本块详情对话框 */}
      <ChunkViewDialog open={viewDialogOpen} chunk={viewChunk} onClose={handleCloseViewDialog} />
    </Container>
  );
}
