'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Multi-turn dataset data hook
 * @param {string} projectId
 */
export const useMultiTurnData = projectId => {
  const { t } = useTranslation();
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const [filters, setFilters] = useState({
    roleA: '',
    roleB: '',
    scenario: '',
    scoreMin: '',
    scoreMax: '',
    confirmed: ''
  });

  const abortRef = useRef(null);

  const buildQuery = ({ pageIndex, keyword, filterValues }) => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      pageSize: String(rowsPerPage)
    });

    if (keyword) params.append('keyword', keyword);
    if (filterValues.roleA) params.append('roleA', filterValues.roleA);
    if (filterValues.roleB) params.append('roleB', filterValues.roleB);
    if (filterValues.scenario) params.append('scenario', filterValues.scenario);
    if (filterValues.scoreMin) params.append('scoreMin', filterValues.scoreMin);
    if (filterValues.scoreMax) params.append('scoreMax', filterValues.scoreMax);
    if (filterValues.confirmed) params.append('confirmed', filterValues.confirmed);

    return params;
  };

  const fetchConversations = async (newPage = page, options = {}) => {
    const keyword = options.keyword ?? searchKeyword;
    const filterValues = options.filterValues ?? filters;
    const showLoading = options.showLoading ?? true;

    try {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      if (showLoading) {
        setLoading(true);
      }

      const params = buildQuery({ pageIndex: newPage, keyword, filterValues });
      const response = await fetch(`/api/projects/${projectId}/dataset-conversations?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(t('datasets.fetchDataFailed'));
      }

      const data = await response.json();
      setConversations(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Failed to fetch multi-turn dataset list:', error);
      toast.error(error.message || t('datasets.fetchDataFailed'));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(`/api/projects/${projectId}/dataset-conversations/export`);

      if (!response.ok) {
        throw new Error(t('datasets.exportFailed'));
      }

      const data = await response.json();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `multi-turn-conversations-${projectId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('datasets.exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error.message || t('datasets.exportFailed'));
    } finally {
      setExportLoading(false);
    }
  };

  const fetchAllConversationIds = async () => {
    try {
      const params = new URLSearchParams({ getAllIds: 'true' });
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (filters.roleA) params.append('roleA', filters.roleA);
      if (filters.roleB) params.append('roleB', filters.roleB);
      if (filters.scenario) params.append('scenario', filters.scenario);
      if (filters.scoreMin) params.append('scoreMin', filters.scoreMin);
      if (filters.scoreMax) params.append('scoreMax', filters.scoreMax);
      if (filters.confirmed) params.append('confirmed', filters.confirmed);

      const response = await fetch(`/api/projects/${projectId}/dataset-conversations?${params.toString()}`);
      if (!response.ok) {
        throw new Error(t('datasets.fetchDataFailed'));
      }

      const data = await response.json();
      return data.allConversationIds || [];
    } catch (error) {
      console.error('Failed to fetch all conversation IDs:', error);
      toast.error(error.message || t('datasets.fetchDataFailed'));
      return [];
    }
  };

  const handleDelete = async conversationId => {
    if (!confirm(t('datasets.confirmDeleteConversation'))) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/dataset-conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(t('datasets.deleteFailed'));
      }

      toast.success(t('datasets.deleteSuccess'));
      fetchConversations();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || t('datasets.deleteFailed'));
    }
  };

  const deleteConversationsConcurrently = async (conversationIds, concurrency = 10) => {
    const results = [];
    const errors = [];

    for (let i = 0; i < conversationIds.length; i += concurrency) {
      const batch = conversationIds.slice(i, i + concurrency);
      const promises = batch.map(async id => {
        try {
          const response = await fetch(`/api/projects/${projectId}/dataset-conversations/${id}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error(`Delete conversation ${id} failed`);
          }
          return { id, success: true };
        } catch (error) {
          errors.push({ id, error: error.message });
          return { id, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    return { results, errors };
  };

  const handleBatchDelete = async () => {
    let idsToDelete = selectedIds;

    if (isAllSelected) {
      idsToDelete = await fetchAllConversationIds();
      if (idsToDelete.length === 0) {
        toast.error(t('datasets.noDataToDelete'));
        return;
      }
    }

    if (idsToDelete.length === 0) {
      toast.error(t('datasets.pleaseSelectData'));
      return;
    }

    if (!confirm(t('common.confirmDelete', { count: idsToDelete.length }))) {
      return;
    }

    try {
      setBatchDeleteLoading(true);
      const { results, errors } = await deleteConversationsConcurrently(idsToDelete);

      const successCount = results.filter(r => r.success).length;
      const failCount = errors.length;

      if (failCount === 0) {
        toast.success(t('common.deleteSuccess', { count: successCount }));
      } else {
        toast.warning(t('datasets.batchDeletePartialSuccess', { success: successCount, fail: failCount }));
      }

      setSelectedIds([]);
      setIsAllSelected(false);
      fetchConversations();
    } catch (error) {
      console.error('Batch delete failed:', error);
      toast.error(error.message || t('datasets.batchDeleteFailed'));
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const handleSelectionChange = newSelectedIds => {
    setSelectedIds(newSelectedIds);
    if (newSelectedIds.length === 0) {
      setIsAllSelected(false);
    }
  };

  const handleSelectAll = selectAll => {
    setIsAllSelected(selectAll);
    if (!selectAll) {
      setSelectedIds([]);
    }
  };

  const handleView = conversationId => {
    router.push(`/projects/${projectId}/multi-turn/${conversationId}`);
  };

  const applyFilters = () => {
    setPage(0);
    setFilterDialogOpen(false);
    fetchConversations(0, { keyword: searchKeyword, filterValues: filters });
  };

  const resetFilters = () => {
    const clearedFilters = {
      roleA: '',
      roleB: '',
      scenario: '',
      scoreMin: '',
      scoreMax: '',
      confirmed: ''
    };
    setFilters(clearedFilters);
    setSearchKeyword('');
    setPage(0);
    fetchConversations(0, { keyword: '', filterValues: clearedFilters });
  };

  const handleSearch = () => {
    setPage(0);
    fetchConversations(0, { keyword: searchKeyword, filterValues: filters });
  };

  const handlePageChange = newPage => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = newRowsPerPage => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  useEffect(() => {
    fetchConversations(page, { showLoading: true });
  }, [projectId, page, rowsPerPage]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    conversations,
    loading,
    page,
    rowsPerPage,
    total,
    searchKeyword,
    filterDialogOpen,
    exportLoading,
    filters,

    selectedIds,
    isAllSelected,
    batchDeleteLoading,

    setSearchKeyword,
    setFilterDialogOpen,
    setFilters,

    fetchConversations,
    handleExport,
    handleDelete,
    handleView,
    applyFilters,
    resetFilters,
    handleSearch,
    handlePageChange,
    handleRowsPerPageChange,

    handleBatchDelete,
    handleSelectionChange,
    handleSelectAll
  };
};
