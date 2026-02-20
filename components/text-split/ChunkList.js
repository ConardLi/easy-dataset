'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, CircularProgress, Pagination, Grid } from '@mui/material';
import ChunkListHeader from './ChunkListHeader';
import ChunkCard from './ChunkCard';
import ChunkViewDialog from './ChunkViewDialog';
import ChunkDeleteDialog from './ChunkDeleteDialog';
import BatchEditChunksDialog from './BatchEditChunkDialog';
import ChunkBatchDeleteDialog from './ChunkBatchDeleteDialog';
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
 * @param {Function} props.onDataCleaning - Data cleaning callback
 * @param {string} props.questionFilter - Question filter
 * @param {Function} props.onQuestionFilterChange - Question filter change callback
 * @param {Object} props.selectedModel - 閫変腑鐨勬ā鍨嬩俊鎭?
 */
export default function ChunkList({
  projectId,
  chunks = [],
  onDelete,
  onEdit,
  onGenerateQuestions,
  onGenerateEvalQuestions,
  onDataCleaning,
  loading = false,
  questionFilter,
  setQuestionFilter,
  selectedModel,
  onChunksUpdate
}) {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [viewChunk, setViewChunk] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState(null);
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [batchEditLoading, setBatchEditLoading] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  // 娣诲姞楂樼骇绛涢€夌姸鎬?
  const [advancedFilters, setAdvancedFilters] = useState({
    contentKeyword: '',
    sizeRange: [0, 10000],
    hasQuestions: null
  });

  // 璁＄畻娲昏穬绛涢€夋潯浠舵暟
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.contentKeyword) count++;
    if (advancedFilters.sizeRange[0] > 0 || advancedFilters.sizeRange[1] < 10000) count++;
    if (advancedFilters.hasQuestions !== null) count++;
    return count;
  }, [advancedFilters]);

  const sortedChunks = useMemo(
    () =>
      [...chunks].sort((a, b) => {
        if (a.fileId !== b.fileId) {
          return a.fileId.localeCompare(b.fileId);
        }

        const getPartNumber = name => {
          const match = name.match(/part-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const numA = getPartNumber(a.name);
        const numB = getPartNumber(b.name);

        return numA - numB;
      }),
    [chunks]
  );

  const filteredChunks = useMemo(() => {
    return sortedChunks.filter(chunk => {
      if (advancedFilters.contentKeyword) {
        const keyword = advancedFilters.contentKeyword.toLowerCase();
        if (!chunk.content?.toLowerCase().includes(keyword)) {
          return false;
        }
      }

      const size = chunk.size || 0;
      if (size < advancedFilters.sizeRange[0] || size > advancedFilters.sizeRange[1]) {
        return false;
      }

      if (advancedFilters.hasQuestions !== null) {
        const hasQuestions = chunk.Questions && chunk.Questions.length > 0;
        if (advancedFilters.hasQuestions !== hasQuestions) {
          return false;
        }
      }

      return true;
    });
  }, [sortedChunks, advancedFilters]);

  // 褰撶瓫閫夋潯浠跺彉鍖栨椂锛屾竻闄や笉鍦ㄧ瓫閫夌粨鏋滀腑鐨勯€変腑椤?
  useEffect(() => {
    const filteredChunkIds = filteredChunks.map(chunk => chunk.id);
    setSelectedChunks(prev => prev.filter(id => filteredChunkIds.includes(id)));
  }, [filteredChunks]);

  const itemsPerPage = 5;
  const displayedChunks = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredChunks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChunks, page]);
  const totalPages = useMemo(() => Math.ceil(filteredChunks.length / itemsPerPage), [filteredChunks.length]);
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

  // 澶勭悊缂栬緫鏂囨湰鍧?
  const handleEditChunk = async (chunkId, newContent) => {
    if (onEdit) {
      onEdit(chunkId, newContent);
      onChunksUpdate();
    }
  };

  // 澶勭悊閫夋嫨鏂囨湰鍧?
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
    if (selectedChunks.length === filteredChunks.length) {
      setSelectedChunks([]);
    } else {
      setSelectedChunks(filteredChunks.map(chunk => chunk.id));
    }
  };

  const handleBatchGenerateQuestions = () => {
    if (onGenerateQuestions && selectedChunks.length > 0) {
      onGenerateQuestions(selectedChunks);
    }
  };

  const handleBatchEdit = async editData => {
    try {
      setBatchEditLoading(true);

      // 璋冪敤鎵归噺缂栬緫API
      const response = await fetch(`/api/projects/${projectId}/chunks/batch-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position: editData.position,
          content: editData.content,
          chunkIds: editData.chunkIds
        })
      });

      if (!response.ok) {
        throw new Error('鎵归噺缂栬緫澶辫触');
      }

      const result = await response.json();

      if (result.success) {
        // 缂栬緫鎴愬姛鍚庯紝鍒锋柊鏂囨湰鍧楁暟鎹?
        if (onChunksUpdate) {
          onChunksUpdate();
        }

        // 娓呯┖閫変腑鐘舵€?
        setSelectedChunks([]);

        // 鍏抽棴瀵硅瘽妗?
        setBatchEditDialogOpen(false);

        // 鏄剧ず鎴愬姛娑堟伅
        console.log(`鎴愬姛鏇存柊浜?${result.updatedCount} 涓枃鏈潡`);
      } else {
        throw new Error(result.message || '鎵归噺缂栬緫澶辫触');
      }
    } catch (error) {
      console.error('鎵归噺缂栬緫澶辫触:', error);
      // 杩欓噷鍙互娣诲姞閿欒鎻愮ず
    } finally {
      setBatchEditLoading(false);
    }
  };

  // 鎵撳紑鎵归噺缂栬緫瀵硅瘽妗?
  const handleOpenBatchEdit = () => {
    setBatchEditDialogOpen(true);
  };

  // 鍏抽棴鎵归噺缂栬緫瀵硅瘽妗?
  const handleCloseBatchEdit = () => {
    setBatchEditDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 澶勭悊绛涢€夊彉鍖?
  const handleFilterChange = filters => {
    setAdvancedFilters(filters);
    setPage(1); // 閲嶇疆鍒扮涓€椤?
  };

  // 鎵撳紑鎵归噺鍒犻櫎瀵硅瘽妗?
  const handleOpenBatchDelete = () => {
    setBatchDeleteDialogOpen(true);
  };

  // 鍏抽棴鎵归噺鍒犻櫎瀵硅瘽妗?
  const handleCloseBatchDelete = () => {
    setBatchDeleteDialogOpen(false);
  };

  // 纭鎵归噺鍒犻櫎
  const handleConfirmBatchDelete = async () => {
    if (selectedChunks.length === 0) return;

    try {
      setBatchDeleteLoading(true);

      let successCount = 0;
      let failCount = 0;

      // 寰幆璋冪敤鍗曚釜鍒犻櫎鎺ュ彛
      for (const chunkId of selectedChunks) {
        try {
          await onDelete(chunkId);
          successCount++;
        } catch (error) {
          console.error(`鍒犻櫎鏂囨湰鍧?${chunkId} 澶辫触:`, error);
          failCount++;
        }
      }

      // 鏄剧ず鍒犻櫎缁撴灉
      if (failCount === 0) {
        console.log(`鎴愬姛鍒犻櫎 ${successCount} 涓枃鏈潡`);
      } else {
        console.log(`删除完成：成功 ${successCount} 个，失败 ${failCount} 个`);
      }

      // 娓呯┖閫変腑鐘舵€?
      setSelectedChunks([]);

      // 鍒锋柊鏁版嵁
      if (onChunksUpdate) {
        onChunksUpdate();
      }

      // 鍏抽棴瀵硅瘽妗?
      setBatchDeleteDialogOpen(false);
    } catch (error) {
      console.error('鎵归噺鍒犻櫎澶辫触:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  return (
    <Box>
      <ChunkListHeader
        projectId={projectId}
        totalChunks={filteredChunks.length}
        selectedChunks={selectedChunks}
        onSelectAll={handleSelectAll}
        onBatchGenerateQuestions={handleBatchGenerateQuestions}
        onBatchEditChunks={handleOpenBatchEdit}
        onBatchDeleteChunks={handleOpenBatchDelete}
        questionFilter={questionFilter}
        setQuestionFilter={event => setQuestionFilter(event.target.value)}
        chunks={chunks}
        selectedModel={selectedModel}
        onFilterChange={handleFilterChange}
        activeFilterCount={activeFilterCount}
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
              onGenerateEvalQuestions={() => onGenerateEvalQuestions && onGenerateEvalQuestions(chunk.id)}
              onDataCleaning={() => onDataCleaning && onDataCleaning([chunk.id])}
              projectId={projectId}
              selectedModel={selectedModel}
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

      {/* 鏂囨湰鍧楄鎯呭璇濇 */}
      <ChunkViewDialog open={viewDialogOpen} chunk={viewChunk} onClose={handleCloseViewDialog} />

      {/* 鍒犻櫎纭瀵硅瘽妗?*/}
      <ChunkDeleteDialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} onConfirm={handleConfirmDelete} />

      {/* 鎵归噺缂栬緫瀵硅瘽妗?*/}
      <BatchEditChunksDialog
        open={batchEditDialogOpen}
        onClose={handleCloseBatchEdit}
        onConfirm={handleBatchEdit}
        selectedChunks={selectedChunks}
        totalChunks={chunks.length}
        loading={batchEditLoading}
      />

      {/* 鎵归噺鍒犻櫎纭瀵硅瘽妗?*/}
      <ChunkBatchDeleteDialog
        open={batchDeleteDialogOpen}
        onClose={handleCloseBatchDelete}
        onConfirm={handleConfirmBatchDelete}
        loading={batchDeleteLoading}
        count={selectedChunks.length}
      />
    </Box>
  );
}

