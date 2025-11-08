'use client';

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
  TextField,
  Card,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StarIcon from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getRatingConfigI18n, formatScore } from '@/components/datasets/utils/ratingUtils';

// 数据集列表组件
const DatasetList = ({
  datasets,
  onViewDetails,
  onDelete,
  onEvaluate,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  total,
  selectedIds,
  onSelectAll,
  onSelectItem,
  evaluatingIds = []
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const bgColor = theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light;
  const color =
    theme.palette.mode === 'dark'
      ? theme.palette.getContrastText(theme.palette.primary.main)
      : theme.palette.getContrastText(theme.palette.primary.contrastText);

  const RatingChip = ({ score }) => {
    const config = getRatingConfigI18n(score, t);
    return (
      <Chip
        icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
        label={`${formatScore(score)} ${config.label}`}
        size="small"
        sx={{
          backgroundColor: config.backgroundColor,
          color: config.color,
          fontWeight: 'medium',
          '& .MuiChip-icon': {
            color: config.color
          }
        }}
      />
    );
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)'
              }}
            >
              <TableCell
                padding="checkbox"
                sx={{
                  color: theme.palette.text.primary,
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  py: 2
                }}
              >
                <Checkbox
                  color="primary"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < total}
                  checked={total > 0 && selectedIds.length === total}
                  onChange={onSelectAll}
                  sx={{
                    '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                      color: theme.palette.primary.main,
                      filter: `drop-shadow(0 0 4px ${theme.palette.primary.main}60)`
                    }
                  }}
                />
              </TableCell>
              <TableCell
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  padding: '16px 12px',
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  minWidth: 200
                }}
              >
                {t('datasets.question')}
              </TableCell>
              <TableCell
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  padding: '16px 12px',
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  width: 120
                }}
              >
                {t('datasets.rating', '评分')}
              </TableCell>
              <TableCell
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  padding: '16px 12px',
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  width: 100
                }}
              >
                {t('datasets.model')}
              </TableCell>
              <TableCell
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  padding: '16px 12px',
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  width: 100
                }}
              >
                {t('datasets.domainTag')}
              </TableCell>
              <TableCell
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  padding: '16px 12px',
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  width: 120
                }}
              >
                {t('datasets.createdAt')}
              </TableCell>
              <TableCell
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  padding: '16px 12px',
                  borderBottom: isDark 
                    ? `2px solid rgba(99, 102, 241, 0.2)`
                    : `2px solid ${theme.palette.divider}`,
                  width: 120
                }}
              >
                {t('common.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((dataset, index) => (
              <TableRow
                component={motion.tr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                key={dataset.id}
                sx={{
                  '&:nth-of-type(odd)': { 
                    backgroundColor: isDark 
                      ? 'rgba(99, 102, 241, 0.03)'
                      : alpha(theme.palette.primary.light, 0.02) 
                  },
                  '&:hover': { 
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.08)'
                      : alpha(theme.palette.primary.light, 0.08),
                    transform: 'translateX(4px)',
                    boxShadow: isDark
                      ? `inset 4px 0 0 ${theme.palette.primary.main}`
                      : `inset 4px 0 0 ${theme.palette.primary.light}`
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => onViewDetails(dataset.id)}
              >
                  <TableCell
                    padding="checkbox"
                    sx={{
                      borderLeft: selectedIds.includes(dataset.id)
                        ? `3px solid ${theme.palette.primary.main}`
                        : `3px solid transparent`,
                      transition: 'border-left 0.2s ease'
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
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                          filter: `drop-shadow(0 0 6px ${theme.palette.primary.main}60)`,
                          animation: 'checkPulse 0.3s ease-out'
                        },
                        '@keyframes checkPulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.2)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.4,
                          mb: 0.5
                        }}
                      >
                        {dataset.question}
                      </Typography>
                      {dataset.confirmed && (
                        <Chip
                          label={t('datasets.confirmed')}
                          size="small"
                          sx={{
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(5, 150, 105, 0.12) 100%)'
                              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(5, 150, 105, 0.08) 100%)',
                            color: theme.palette.success.dark,
                            fontWeight: 600,
                            height: 22,
                            fontSize: '0.7rem',
                            mt: 1,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.2)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                              transform: 'translateY(-1px)'
                            }
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <RatingChip score={dataset.score || 0} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dataset.model}
                      size="small"
                      sx={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.12) 100%)'
                          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.08) 100%)',
                        color: theme.palette.info.dark,
                        fontWeight: 600,
                        maxWidth: '100%',
                        border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                        boxShadow: `0 2px 6px ${alpha(theme.palette.info.main, 0.15)}`,
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.75rem'
                        },
                        '&:hover': {
                          boxShadow: `0 4px 10px ${alpha(theme.palette.info.main, 0.25)}`,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {dataset.questionLabel ? (
                      <Chip
                        label={dataset.questionLabel}
                        size="small"
                        sx={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.12) 100%)'
                            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.08) 100%)',
                          color: theme.palette.primary.dark,
                          fontWeight: 600,
                          maxWidth: '100%',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                          boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.15)}`,
                          transition: 'all 0.2s ease',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.75rem'
                          },
                          '&:hover': {
                            boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.25)}`,
                            transform: 'translateY(-1px)'
                          }
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.disabled',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          opacity: 0.6
                        }}
                      >
                        {t('datasets.noTag')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                      {new Date(dataset.createAt).toLocaleDateString('zh-CN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Tooltip title={t('datasets.viewDetails')} arrow>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            onViewDetails(dataset.id);
                          }}
                          sx={{
                            color: theme.palette.primary.main,
                            border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            borderRadius: '8px',
                            width: 32,
                            height: 32,
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.primary.main, 0.15),
                              borderColor: theme.palette.primary.main,
                              transform: 'translateY(-2px) scale(1.05)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                            }
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('datasets.evaluate')} arrow>
                        <span>
                          <IconButton
                            size="small"
                            disabled={evaluatingIds.includes(dataset.id)}
                            onClick={e => {
                              e.stopPropagation();
                              onEvaluate && onEvaluate(dataset);
                            }}
                            sx={{
                              color: theme.palette.secondary.main,
                              border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                              borderRadius: '8px',
                              width: 32,
                              height: 32,
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                                borderColor: theme.palette.secondary.main,
                                transform: 'translateY(-2px) scale(1.05)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`
                              },
                              '&:disabled': {
                                opacity: 0.6,
                                borderColor: alpha(theme.palette.secondary.main, 0.2)
                              }
                            }}
                          >
                            {evaluatingIds.includes(dataset.id) ? (
                              <CircularProgress size={16} sx={{ color: theme.palette.secondary.main }} />
                            ) : (
                              <AssessmentIcon sx={{ fontSize: '1.1rem' }} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('common.delete')} arrow>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            onDelete(dataset);
                          }}
                          sx={{
                            color: theme.palette.error.main,
                            border: `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`,
                            borderRadius: '8px',
                            width: 32,
                            height: 32,
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.error.main, 0.15),
                              borderColor: theme.palette.error.main,
                              transform: 'translateY(-2px) scale(1.05)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
            ))}
            {datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)'
                          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}
                    >
                      <StorageIcon 
                        sx={{ 
                          fontSize: 32,
                          color: theme.palette.primary.main,
                          opacity: 0.6
                        }} 
                      />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 600
                      }}
                    >
                      {t('datasets.noData')}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: 'text.secondary',
                        opacity: 0.7
                      }}
                    >
                      {t('datasets.noDataHint', '暂无数据，请创建新的数据集')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderTop: isDark
            ? `1px solid rgba(99, 102, 241, 0.15)`
            : `1px solid ${theme.palette.divider}`,
          background: isDark
            ? 'rgba(99, 102, 241, 0.02)'
            : alpha(theme.palette.primary.light, 0.02)
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography 
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.secondary'
            }}
          >
            {t('common.jumpTo')}:
          </Typography>
          <TextField
            size="small"
            type="number"
            placeholder="..."
            inputProps={{
              min: 1,
              max: Math.ceil(total / rowsPerPage),
              style: { 
                padding: '6px 10px', 
                width: '60px',
                textAlign: 'center'
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.05)'
                  : alpha(theme.palette.primary.light, 0.05),
                '& fieldset': {
                  borderColor: isDark
                    ? 'rgba(99, 102, 241, 0.2)'
                    : alpha(theme.palette.primary.main, 0.2),
                  borderWidth: '1.5px'
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '1.5px'
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '2px',
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                }
              }
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
    </Box>
  );
};

export default DatasetList;
