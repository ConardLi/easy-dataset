'use client';

import { useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Pagination, Grid } from '@mui/material';
import ChunkListHeader from './ChunkListHeader';
import ChunkCard from './ChunkCard';
import ChunkViewDialog from './ChunkViewDialog';
import ChunkDeleteDialog from './ChunkDeleteDialog';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

/**
 * Chunk list component
 * @param {Object} props
 * @param {string} props.projectId - Project ID
 * @param {Array} props.chunks - Chunk array
 * @param {Function} props.onDelete - Delete callback
 * @param {Function} props.onEdit - Edit callback
 * @param {Function} props.onGenerateQuestions - Generate questions callback
 * @param {string} props.questionFilter - Question filter
 * @param {Function} props.onQuestionFilterChange - Question filter change callback
 */
export default function ChunkList({
  projectId,
  chunks = [],
  onDelete,
  onEdit,
  onGenerateQuestions,
  loading = false,
  questionFilter,
  setQuestionFilter
}) {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [viewChunk, setViewChunk] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState(null);

  const itemsPerPage = 5;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedChunks = chunks.slice(startIndex, endIndex);
  const totalPages = Math.ceil(chunks.length / itemsPerPage);
  const { t } = useTranslation();

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewChunk = async chunkId => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chunks/${chunkId}`);
      if (!response.ok) {
        throw new Error(t('textSplit.fetchChunksFailed'));
      }

      const data = await response.json();
      setViewChunk(data);
      setViewDialogOpen(true);
    } catch (error) {
      console.error(t('textSplit.fetchChunksError'), error);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  const handleOpenDeleteDialog = chunkId => {
    setChunkToDelete(chunkId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setChunkToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (chunkToDelete && onDelete) {
      onDelete(chunkToDelete);
    }
    handleCloseDeleteDialog();
  };

  // 处理编辑文本块
  const handleEditChunk = async (chunkId, newContent) => {
    if (onEdit) {
      onEdit(chunkId, newContent);
    }
  };

  // 处理选择文本块
  const handleSelectChunk = chunkId => {
    setSelectedChunks(prev => {
      if (prev.includes(chunkId)) {
        return prev.filter(id => id !== chunkId);
      } else {
        return [...prev, chunkId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedChunks.length === chunks.length) {
      setSelectedChunks([]);
    } else {
      setSelectedChunks(chunks.map(chunk => chunk.id));
    }
  };

  const handleBatchGenerateQuestions = () => {
    if (onGenerateQuestions && selectedChunks.length > 0) {
      onGenerateQuestions(selectedChunks);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <ChunkListHeader
        totalChunks={chunks.length}
        selectedChunks={selectedChunks}
        onSelectAll={handleSelectAll}
        onBatchGenerateQuestions={handleBatchGenerateQuestions}
        questionFilter={questionFilter}
        setQuestionFilter={event => setQuestionFilter(event.target.value)}
        chunks={chunks}
      />

      <Grid container spacing={2}>
        {displayedChunks.map(chunk => (
          <Grid item xs={12} key={chunk.id}>
            <ChunkCard
              chunk={chunk}
              selected={selectedChunks.includes(chunk.id)}
              onSelect={() => handleSelectChunk(chunk.id)}
              onView={() => handleViewChunk(chunk.id)}
              onDelete={() => handleOpenDeleteDialog(chunk.id)}
              onEdit={handleEditChunk}
              onGenerateQuestions={() => onGenerateQuestions && onGenerateQuestions([chunk.id])}
              projectId={projectId}
            />
          </Grid>
        ))}
      </Grid>

      {chunks.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}
        >
          <Typography variant="body1" color="textSecondary">
            {t('textSplit.noChunks')}
          </Typography>
        </Paper>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}

      {/* 文本块详情对话框 */}
      <ChunkViewDialog open={viewDialogOpen} chunk={viewChunk} onClose={handleCloseViewDialog} />

      {/* 删除确认对话框 */}
      <ChunkDeleteDialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} onConfirm={handleConfirmDelete} />
    </Box>
  );
}
