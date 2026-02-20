'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  CircularProgress,
  Checkbox
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import RatingChip from './RatingChip';

const QUESTION_TOOLTIP_THRESHOLD = 80;
const SCENARIO_TOOLTIP_THRESHOLD = 120;

const ConversationTable = ({
  conversations,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onDelete,
  selectedIds = [],
  onSelectionChange,
  isAllSelected = false,
  onSelectAll
}) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState({});
  const columnWidths = {
    checkbox: 52,
    question: 280,
    scenario: 340,
    rounds: 90,
    model: 120,
    rating: 100,
    createdAt: 110,
    actions: 92
  };

  const shouldShowTooltip = (value, threshold) => (value || '').length > threshold;

  const handleSelectOne = conversationId => {
    if (selectedIds.includes(conversationId)) {
      onSelectionChange(selectedIds.filter(id => id !== conversationId));
    } else {
      onSelectionChange([...selectedIds, conversationId]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
      onSelectAll(false);
    } else {
      const currentPageIds = conversations.map(conv => conv.id);
      onSelectionChange(currentPageIds);
      onSelectAll(true);
    }
  };

  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const toggleRowExpanded = conversationId => {
    setExpandedRows(prev => ({ ...prev, [conversationId]: !prev[conversationId] }));
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
      <Table
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          minWidth: 1184,
          '& .MuiTableCell-root': {
            px: 1.25,
            py: 1
          }
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell padding="checkbox" sx={{ width: columnWidths.checkbox, py: 1.25 }}>
              <Checkbox indeterminate={isIndeterminate} checked={isAllSelected} onChange={handleSelectAll} />
            </TableCell>
            <TableCell sx={{ width: columnWidths.question, minWidth: columnWidths.question, py: 1.25 }}>
              {t('datasets.firstQuestion')}
            </TableCell>
            <TableCell sx={{ width: columnWidths.scenario, minWidth: columnWidths.scenario, py: 1.25 }}>
              {t('datasets.conversationScenario')}
            </TableCell>
            <TableCell sx={{ width: columnWidths.rounds, py: 1.25 }}>{t('datasets.conversationRounds')}</TableCell>
            <TableCell sx={{ width: columnWidths.model, py: 1.25 }}>{t('datasets.modelUsed')}</TableCell>
            <TableCell sx={{ width: columnWidths.rating, py: 1.25 }}>{t('datasets.rating')}</TableCell>
            <TableCell sx={{ width: columnWidths.createdAt, py: 1.25 }}>{t('datasets.createTime')}</TableCell>
            <TableCell
              align="center"
              sx={{
                width: columnWidths.actions,
                py: 1.25,
                position: 'sticky',
                right: 0,
                zIndex: 3,
                bgcolor: 'background.paper',
                borderLeft: 1,
                borderColor: 'divider'
              }}
            >
              {t('common.actions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <CircularProgress size={40} />
              </TableCell>
            </TableRow>
          ) : conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('datasets.noConversations')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            conversations.map(conversation => {
              const questionText = conversation.question || '';
              const scenarioText = conversation.scenario || '';
              const isExpanded = Boolean(expandedRows[conversation.id]);
              const canToggleExpand =
                questionText.length > QUESTION_TOOLTIP_THRESHOLD || scenarioText.length > SCENARIO_TOOLTIP_THRESHOLD;

              const questionContent = (
                <Typography
                  variant="body2"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word',
                    wordBreak: 'normal',
                    lineHeight: 1.5
                  }}
                >
                  {questionText}
                </Typography>
              );

              const scenarioContent = (
                <Paper
                  variant="outlined"
                  sx={{
                    px: 1,
                    py: 0.5,
                    maxWidth: '100%',
                    borderColor: scenarioText ? 'primary.main' : 'divider',
                    backgroundColor: scenarioText ? 'action.selected' : 'background.default'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: isExpanded ? 'unset' : 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'normal',
                      lineHeight: 1.45
                    }}
                  >
                    {scenarioText || t('datasets.notSet')}
                  </Typography>
                </Paper>
              );

              return (
                <TableRow key={conversation.id} hover>
                  <TableCell padding="checkbox" sx={{ verticalAlign: 'top' }}>
                    <Checkbox
                      checked={selectedIds.includes(conversation.id)}
                      onChange={() => handleSelectOne(conversation.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    {shouldShowTooltip(questionText, QUESTION_TOOLTIP_THRESHOLD) ? (
                      <Tooltip title={questionText} placement="top-start">
                        {questionContent}
                      </Tooltip>
                    ) : (
                      questionContent
                    )}
                    {conversation.confirmed && (
                      <Chip
                        label={t('datasets.confirmed')}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ mt: 0.5, fontSize: '0.7rem' }}
                      />
                    )}
                    {canToggleExpand && (
                      <Typography
                        variant="caption"
                        color="primary.main"
                        sx={{ display: 'block', mt: 0.5, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => toggleRowExpanded(conversation.id)}
                      >
                        {isExpanded ? t('common.collapse') : t('common.expand')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    {shouldShowTooltip(scenarioText, SCENARIO_TOOLTIP_THRESHOLD) ? (
                      <Tooltip title={scenarioText} placement="top-start">
                        {scenarioContent}
                      </Tooltip>
                    ) : (
                      scenarioContent
                    )}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    <Typography variant="body2">
                      {conversation.turnCount}/{conversation.maxTurns}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    <Chip
                      label={conversation.model}
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{
                        maxWidth: '100%',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    <RatingChip score={conversation.score || 0} />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    <Typography variant="caption">{new Date(conversation.createAt).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      verticalAlign: 'top',
                      position: 'sticky',
                      right: 0,
                      zIndex: 2,
                      bgcolor: 'background.paper',
                      borderLeft: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Tooltip title={t('datasets.viewDetails')}>
                      <IconButton size="small" color="primary" onClick={() => onView(conversation.id)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => onDelete(conversation.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(event, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[20, 50, 100]}
        onRowsPerPageChange={event => {
          onRowsPerPageChange(parseInt(event.target.value, 10));
        }}
        labelRowsPerPage={t('datasets.rowsPerPage')}
      />
    </TableContainer>
  );
};

export default ConversationTable;
