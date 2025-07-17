'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Checkbox,
  TablePagination,
  Card,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import FlakyOutlinedIcon from '@mui/icons-material/FlakyOutlined';
import { useTranslation } from 'react-i18next';

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
                  indeterminate={selectedIds.length > 0 && selectedIds.length < total}
                  checked={total > 0 && selectedIds.length === total}
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
                {t('datasets.validationStatus')}
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
                {t('datasets.traceability')}
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
              {/* <TableCell
                  sx={{
                    backgroundColor: bgColor,
                    color: color,
                    fontWeight: 'bold',
                    padding: '16px 8px',
                    borderBottom: `2px solid ${theme.palette.divider}`
                  }}>
                {t('datasets.chunkId')}
              </TableCell> */}
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
                    {dataset.confirmed}
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
                    {new Date(dataset.createAt).toLocaleString('zh-CN')}
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
                  {renderValidationStatus(dataset.validationStatus)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {dataset.traceabilityScore !== null && dataset.traceabilityScore !== undefined
                      ? `${(dataset.traceabilityScore * 100).toFixed(0)}%`
                      : 'N/A'}
                  </Typography>
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
                {/* <TableCell sx={{ maxWidth: 200 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                    {dataset.chunkId}
                  </Typography>
                </TableCell> */}
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage={t('datasets.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => t('datasets.pagination', { from, to, count })}
          sx={{
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontWeight: 'medium'
            },
            border: 'none'
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{t('common.jumpTo')}:</Typography>
          <TextField
            size="small"
            type="number"
            inputProps={{
              min: 1,
              max: Math.ceil(total / rowsPerPage),
              style: { padding: '4px 8px', width: '50px' }
            }}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                const pageNum = parseInt(e.target.value, 10);
                if (pageNum >= 1 && pageNum <= Math.ceil(total / rowsPerPage)) {
                  onPageChange(null, pageNum - 1);
                  e.target.value = '';
                }
              }
            }}
          />
        </Box>
      </Box>
    </Card>
  );
};

export default DatasetList;
