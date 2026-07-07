'use client';

import React, { useRef, useEffect, useState, Fragment } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import 'github-markdown-css/github-markdown-light.css';

function getScoreColor(score) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

/**
 * 检测原子块完整性问题，返回 i18n key 数组
 * @param {string} content
 * @returns {string[]}
 */
function hasUnbalancedHtmlTable(content) {
  const openCount = (content.match(/<table\b[^>]*>/gi) || []).length;
  const closeCount = (content.match(/<\/table\s*>/gi) || []).length;
  return openCount !== closeCount;
}

function detectAtomicIssues(content) {
  if (!content) return [];
  const issues = [];
  const fences = content.match(/^(`{3,}|~{3,})/gm);
  if (fences && fences.length % 2 !== 0) {
    issues.push('textSplit.atomicIssueUnclosedCode');
  }
  if ((content.match(/\$\$/g) || []).length % 2 !== 0) {
    issues.push('textSplit.atomicIssueUnclosedMath');
  }
  if (hasUnbalancedHtmlTable(content)) {
    issues.push('textSplit.atomicIssueUnclosedHtmlTable');
  }
  const tableRows = content.match(/^\|.*\|$/gm);
  if (tableRows && tableRows.length > 1) {
    const hasSep = tableRows.some(r => /^\|[\s\-:|]+\|$/.test(r));
    if (!hasSep) {
      issues.push('textSplit.atomicIssueIncompleteTable');
    }
  }
  return issues;
}

/**
 * 分块预览列表组件
 * 支持展开/编辑/删除/向上合并/向下合并
 */
export default function ChunkPreviewList({
  chunks = [],
  activeChunkIndex,
  onChunkClick,
  onChunksChange
}) {
  const { t } = useTranslation();
  const chunkRefs = useRef([]);
  const [expandedSet, setExpandedSet] = useState(new Set());
  const [editingIndex, setEditingIndex] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [splittingIndex, setSplittingIndex] = useState(null);

  // activeChunkIndex 改变时滚动到对应位置
  useEffect(() => {
    if (activeChunkIndex != null && chunkRefs.current[activeChunkIndex]) {
      chunkRefs.current[activeChunkIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeChunkIndex]);

  if (!chunks || chunks.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">{t('textSplit.advancedSplitNoChunks')}</Typography>
      </Box>
    );
  }

  const toggleExpand = (index) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setSplittingIndex(null);
    setEditContent(chunks[index].content);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditContent('');
  };

  const saveEdit = (index) => {
    if (!onChunksChange) return;
    const updated = chunks.map((c, i) =>
      i === index ? { ...c, content: editContent, size: editContent.length } : c
    );
    onChunksChange(updated);
    setEditingIndex(null);
    setEditContent('');
  };

  const deleteChunk = (index) => {
    if (!onChunksChange || chunks.length <= 1) return;
    onChunksChange(chunks.filter((_, i) => i !== index));
  };

  // 标题去重合并辅助
  const dedupeHeadings = (headingsA, headingsB) => {
    const merged = [...(headingsA || []), ...(headingsB || [])];
    return [...new Set(merged)];
  };

  // 清理自动生成的上下文标记（合并时去除残留）
  const stripAutoContext = (content) => {
    if (!content) return content;
    return content
      .replace(/^>\s*(?:Section:|所属章节：)[^\n]*(?:\n|$)/gm, '')
      .replace(/^[^\n]*（续 \d+\/\d+）[^\n]*(?:\n|$)/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const mergeUp = (index) => {
    if (!onChunksChange || index === 0) return;
    const merged = [...chunks];
    const target = merged[index - 1];
    const source = merged[index];
    const cleanTarget = stripAutoContext(target.content);
    const cleanSource = stripAutoContext(source.content);
    merged[index - 1] = {
      ...target,
      content: cleanTarget + '\n\n' + cleanSource,
      size: cleanTarget.length + cleanSource.length + 2,
      headings: dedupeHeadings(target.headings, source.headings),
      headingPath: dedupeHeadings(target.headingPath, source.headingPath)
    };
    merged.splice(index, 1);
    onChunksChange(merged);
  };

  const mergeDown = (index) => {
    if (!onChunksChange || index >= chunks.length - 1) return;
    const merged = [...chunks];
    const target = merged[index];
    const source = merged[index + 1];
    const cleanTarget = stripAutoContext(target.content);
    const cleanSource = stripAutoContext(source.content);
    merged[index] = {
      ...target,
      content: cleanTarget + '\n\n' + cleanSource,
      size: cleanTarget.length + cleanSource.length + 2,
      headings: dedupeHeadings(target.headings, source.headings),
      headingPath: dedupeHeadings(target.headingPath, source.headingPath)
    };
    merged.splice(index + 1, 1);
    onChunksChange(merged);
  };

  // ─── 拆分功能 ───────────────────────────────────────────
  const startSplit = (index) => {
    setSplittingIndex(index);
    setEditingIndex(null);
  };

  const cancelSplit = () => {
    setSplittingIndex(null);
  };

  /**
   * 从内容中提取标题列表
   * @param {string} content
   * @returns {string[]}
   */
  const extractHeadingsFromContent = (content) => {
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    const headings = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push(match[1].trim());
    }
    return headings;
  };

  /**
   * 在指定段落后拆分分块
   * @param {number} chunkIndex - 要拆分的分块索引
   * @param {number} paraIndex - 在第 paraIndex 个段落后拆分（0-based）
   */
  const splitAtParagraph = (chunkIndex, paraIndex) => {
    if (!onChunksChange) return;
    const chunk = chunks[chunkIndex];
    const paragraphs = chunk.content.split(/\n{2,}/);

    if (paraIndex < 0 || paraIndex >= paragraphs.length - 1) return;

    const firstPart = paragraphs.slice(0, paraIndex + 1).join('\n\n');
    const secondPart = paragraphs.slice(paraIndex + 1).join('\n\n');

    if (!firstPart.trim() || !secondPart.trim()) {
      cancelSplit();
      return;
    }

    // 从各部分内容中提取标题，若无则继承原分块标题
    const headings1 = extractHeadingsFromContent(firstPart);
    const headings2 = extractHeadingsFromContent(secondPart);

    // 后半部分若无标题行且无已有引用上下文，自动补全标题上下文
    let secondContent = secondPart;
    const secondHasHeading = /^\s*#{1,6}\s+/.test(secondPart.trimStart());
    const secondHasContext = /^\s*>\s*(?:Section:|所属章节：)/.test(secondPart.trimStart());
    const pathArr = chunk.headingPath || [];

    if (!secondHasHeading && !secondHasContext && pathArr.length > 0) {
      const pathStr = pathArr.join(' › ');
      secondContent = `> Section: ${pathStr}\n\n${secondPart}`;
    }

    const newChunks = [...chunks];
    newChunks.splice(chunkIndex, 1,
      {
        ...chunk,
        content: firstPart,
        size: firstPart.length,
        headings: headings1.length > 0 ? headings1 : chunk.headings,
        headingPath: pathArr.length > 0 ? pathArr : chunk.headingPath
      },
      {
        ...chunk,
        content: secondContent,
        size: secondContent.length,
        headings: headings2.length > 0 ? headings2 : chunk.headings,
        headingPath: pathArr.length > 0 ? pathArr : chunk.headingPath
      }
    );

    onChunksChange(newChunks);
    setSplittingIndex(null);
  };

  return (
    <Box sx={{ overflow: 'auto', height: '100%', p: 1 }}>
      {chunks.map((chunk, index) => {
        const isExpanded = expandedSet.has(index);
        const isEditing = editingIndex === index;
        const isSplitting = splittingIndex === index;
        const isActive = activeChunkIndex === index;

        return (
          <Paper
            key={chunk.id || index}
            ref={el => (chunkRefs.current[index] = el)}
            variant="outlined"
            onClick={() => onChunkClick && onChunkClick(index)}
            sx={{
              mb: 1.5,
              p: 1.5,
              cursor: 'pointer',
              borderColor: isActive ? 'primary.main' : 'divider',
              borderWidth: isActive ? 2 : 1,
              bgcolor: isActive ? 'action.selected' : 'background.paper',
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' }
            }}
          >
            {/* 头部：序号 + 质量分 + 操作按钮 + 长度 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Chip label={`#${index + 1}`} size="small" variant="outlined" sx={{ fontWeight: 600, minWidth: 40 }} />
              {chunk.qualityScore != null && (
                <Chip
                  label={`${chunk.qualityScore}`}
                  size="small"
                  color={getScoreColor(chunk.qualityScore)}
                  variant="filled"
                />
              )}
              {/* 原子块完整性警告 */}
              {(() => {
                const issues = detectAtomicIssues(chunk.content);
                if (issues.length === 0) return null;
                return (
                  <Tooltip title={issues.map(key => t(key)).join('；')}>
                    <Chip
                      icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                      label={t('textSplit.atomicIntegrityWarning')}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontSize: '11px', height: 22 }}
                    />
                  </Tooltip>
                );
              })()}

              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0 }}>
                {/* 展开/折叠 */}
                <Tooltip title={isExpanded ? t('textSplit.collapse') : t('textSplit.expand')}>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(index); }}>
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* 编辑 */}
                {isEditing ? (
                  <>
                    <Tooltip title={t('common.save')}>
                      <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); saveEdit(index); }}>
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.cancel')}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title={t('textSplit.editChunkInline')}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); startEdit(index); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* 拆分 */}
                <Tooltip title={t('textSplit.splitChunk')}>
                  <span>
                    <IconButton size="small" disabled={isEditing || chunk.content.trim().length < 100} onClick={(e) => { e.stopPropagation(); startSplit(index); }}>
                      <CallSplitIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* 向上合并 */}
                <Tooltip title={t('textSplit.mergeUp')}>
                  <span>
                    <IconButton size="small" disabled={index === 0} onClick={(e) => { e.stopPropagation(); mergeUp(index); }}>
                      <VerticalAlignTopIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* 向下合并 */}
                <Tooltip title={t('textSplit.mergeDown')}>
                  <span>
                    <IconButton size="small" disabled={index >= chunks.length - 1} onClick={(e) => { e.stopPropagation(); mergeDown(index); }}>
                      <VerticalAlignBottomIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* 删除 */}
                <Tooltip title={t('textSplit.deleteChunkInline')}>
                  <span>
                    <IconButton size="small" color="error" disabled={chunks.length <= 1} onClick={(e) => { e.stopPropagation(); deleteChunk(index); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                  {chunk.size || chunk.content.length} {t('textSplit.characters')}
                </Typography>
              </Box>
            </Box>

            {/* 摘要 */}
            {chunk.summary && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {chunk.summary}
              </Typography>
            )}

            <Divider sx={{ my: 0.5 }} />

            {/* 内容区：编辑模式 / 拆分模式 / Markdown 预览 */}
            {isEditing ? (
              <TextField
                multiline
                fullWidth
                minRows={6}
                maxRows={20}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                sx={{ mt: 0.5, '& .MuiInputBase-input': { fontSize: '12px', fontFamily: 'monospace' } }}
              />
            ) : isSplitting ? (
              <Box sx={{ mt: 0.5 }}>
                {chunk.content.split(/\n{2,}/).map((para, pIdx, paras) => (
                  <React.Fragment key={pIdx}>
                    <Box
                      className="markdown-body"
                      sx={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        '& h1, & h2, & h3, & h4, & h5, & h6': { fontSize: '13px', mt: 0.5, mb: 0.5 },
                        '& p': { my: 0.3 },
                        '& table': { fontSize: '11px' },
                        '& pre': { fontSize: '11px', p: 0.5 }
                      }}
                    >
                      <ReactMarkdown>{para}</ReactMarkdown>
                    </Box>
                    {pIdx < paras.length - 1 && (
                      <Box
                        onClick={(e) => { e.stopPropagation(); splitAtParagraph(index, pIdx); }}
                        sx={{
                          cursor: 'pointer',
                          textAlign: 'center',
                          py: 0.5,
                          my: 0.5,
                          color: 'primary.main',
                          borderBottom: '2px dashed',
                          borderColor: 'primary.light',
                          borderRadius: 0.5,
                          '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' },
                          fontSize: '12px',
                          userSelect: 'none'
                        }}
                      >
                        <CallSplitIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        {t('textSplit.clickToSplit')}
                      </Box>
                    )}
                  </React.Fragment>
                ))}
                <Box sx={{ mt: 1, textAlign: 'right' }}>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); cancelSplit(); }}>
                    {t('common.cancel')}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box
                className="markdown-body"
                sx={{
                  maxHeight: isExpanded ? 'none' : 200,
                  overflow: 'hidden',
                  position: 'relative',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  '& h1, & h2, & h3, & h4, & h5, & h6': { fontSize: '13px', mt: 0.5, mb: 0.5 },
                  '& p': { my: 0.3 },
                  '& table': { fontSize: '11px' },
                  '& pre': { fontSize: '11px', p: 0.5 },
                  ...(!isExpanded && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 40,
                      background: isActive
                        ? 'linear-gradient(transparent, rgba(240,245,255,0.95))'
                        : 'linear-gradient(transparent, rgba(255,255,255,0.95))'
                    }
                  })
                }}
              >
                <ReactMarkdown>{chunk.content}</ReactMarkdown>
              </Box>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
