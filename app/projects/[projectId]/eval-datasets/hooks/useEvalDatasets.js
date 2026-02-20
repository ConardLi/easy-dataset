'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Eval datasets list hook
 * @param {string} projectId
 */
export default function useEvalDatasets(projectId) {
  const [data, setData] = useState({ items: [], total: 0, stats: null, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);
  const abortRef = useRef(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [questionType, setQuestionType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [chunkId, setChunkId] = useState('');
  const [tags, setTags] = useState([]);

  const setQuestionTypeWithReset = useCallback(value => {
    setQuestionType(value);
    setPage(1);
  }, []);

  const setKeywordWithReset = useCallback(value => {
    setKeyword(value);
  }, []);

  const setChunkIdWithReset = useCallback(value => {
    setChunkId(value);
    setPage(1);
  }, []);

  const setTagsWithReset = useCallback(value => {
    setTags(value);
    setPage(1);
  }, []);

  const [viewMode, setViewMode] = useState('card');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      if (keyword !== debouncedKeyword) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchDataRef = useRef(null);
  fetchDataRef.current = async (showLoading = true, options = {}) => {
    if (!projectId) return;

    const includeStats = options.forceStats || showLoading;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (showLoading) {
      setLoading(true);
    } else {
      setSearching(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        includeStats: includeStats ? 'true' : 'false'
      });

      if (questionType) params.append('questionType', questionType);
      if (debouncedKeyword) params.append('keyword', debouncedKeyword);
      if (chunkId) params.append('chunkId', chunkId);
      if (tags.length > 0) {
        tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`/api/projects/${projectId}/eval-datasets?${params}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch eval datasets');
      }

      const result = await response.json();
      setData(prev => ({
        ...result,
        stats: result.stats ?? prev.stats
      }));
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }

      if (showLoading) {
        setLoading(false);
      } else {
        setSearching(false);
      }
    }
  };

  const fetchData = useCallback((showLoading = true, options = {}) => {
    return fetchDataRef.current?.(showLoading, options);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchDataRef.current?.(true, { forceStats: true });
    } else {
      fetchDataRef.current?.(false, { forceStats: false });
    }
  }, [projectId, page, pageSize, questionType, debouncedKeyword, chunkId, tags]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const deleteItems = useCallback(
    async ids => {
      if (!ids || ids.length === 0) return;

      const response = await fetch(`/api/projects/${projectId}/eval-datasets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (!response.ok) {
        throw new Error('Failed to delete items');
      }

      await fetchData(true, { forceStats: true });
      setSelectedIds([]);

      return await response.json();
    },
    [projectId, fetchData]
  );

  const resetFilters = useCallback(() => {
    setQuestionType('');
    setKeyword('');
    setChunkId('');
    setTags([]);
    setPage(1);
  }, []);

  const toggleSelect = useCallback(id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map(item => item.id));
    }
  }, [selectedIds, data.items]);

  return {
    items: data.items,
    total: data.total,
    stats: data.stats,
    totalPages: data.totalPages || 1,

    loading,
    searching,
    error,

    page,
    pageSize,
    setPage,
    setPageSize,

    questionType,
    keyword,
    chunkId,
    tags,
    setQuestionType: setQuestionTypeWithReset,
    setKeyword: setKeywordWithReset,
    setChunkId: setChunkIdWithReset,
    setTags: setTagsWithReset,
    resetFilters,

    viewMode,
    setViewMode,

    selectedIds,
    toggleSelect,
    toggleSelectAll,
    setSelectedIds,

    fetchData,
    deleteItems
  };
}
