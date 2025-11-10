'use client';

import { Box, Stack, Checkbox, Typography, TextField, InputAdornment, Select, MenuItem, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';

export default function QuestionsFilter({
  // 选择相关
  selectedQuestionsCount,
  totalQuestions,
  isAllSelected,
  isIndeterminate,
  onSelectAll,

  // 搜索相关
  searchTerm,
  onSearchChange,

  // 过滤相关
  answerFilter,
  onFilterChange,

  // 文本块名称筛选
  chunkNameFilter,
  onChunkNameFilterChange,

  // 数据源类型筛选
  sourceTypeFilter,
  onSourceTypeFilterChange,

  activeTab
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (activeTab === 1) {
    return <></>;
  }
  return (
    <Box
      sx={{
        position: 'relative',
        p: { xs: 2.5, md: 3 },
        borderRadius: '18px',
        border:
          theme.palette.mode === 'dark'
            ? '1px solid rgba(99, 102, 241, 0.25)'
            : '1px solid rgba(148, 163, 184, 0.3)',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(8, 13, 34, 0.95) 0%, rgba(30, 41, 59, 0.85) 45%, rgba(59, 130, 246, 0.25) 115%)'
            : 'linear-gradient(145deg, rgba(244, 247, 255, 0.95) 0%, rgba(226, 232, 255, 0.86) 48%, rgba(191, 219, 254, 0.55) 120%)',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 22px 48px -28px rgba(59, 130, 246, 0.55)'
            : '0 28px 54px -30px rgba(15, 23, 42, 0.18)',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundSize: '48px 48px',
          backgroundImage:
            theme.palette.mode === 'dark'
              ? `linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.08) 1px, transparent 1px)`
              : `linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)`,
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          top: -120,
          right: -140,
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle, rgba(99,102,241,0.35), transparent 62%)'
              : 'radial-gradient(circle, rgba(129,140,248,0.35), transparent 60%)',
          filter: 'blur(42px)',
          opacity: 0.8,
          pointerEvents: 'none'
        }}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        {/* 选择区域 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1, md: 1.5 },
            py: { xs: 1, md: 1.5 },
            borderRadius: '14px',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(59, 130, 246, 0.12)'
                : 'rgba(99, 102, 241, 0.08)',
            border:
              theme.palette.mode === 'dark'
                ? '1px solid rgba(129, 140, 248, 0.4)'
                : '1px solid rgba(99, 102, 241, 0.18)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.18)'
                : 'inset 0 0 0 1px rgba(99, 102, 241, 0.12)'
          }}
        >
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={onSelectAll}
            sx={{
              color: 'primary.main',
              '&.Mui-checked': { color: 'primary.main' }
            }}
          />
          <Typography
            variant="body2"
            sx={{
              ml: 1,
              fontWeight: 600,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              color: theme.palette.mode === 'dark' ? 'rgba(226, 232, 255, 0.82)' : 'rgba(30, 41, 59, 0.82)'
            }}
          >
            {selectedQuestionsCount > 0
              ? t('questions.selectedCount', { count: selectedQuestionsCount })
              : t('questions.selectAll')}
            <Typography component="span" sx={{ ml: 0.5, opacity: 0.7 }}>
              (
              {t('questions.totalCount', {
                count: totalQuestions
              })}
              )
            </Typography>
          </Typography>
        </Box>

        {/* 搜索和过滤区域 */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 2 }}
          justifyContent="flex-end"
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{ width: '100%' }}
        >
          <TextField
            placeholder={t('questions.searchPlaceholder')}
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              width: { xs: '100%', md: 280 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(15, 23, 42, 0.6)'
                    : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                '& fieldset': {
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(129, 140, 248, 0.25)'
                      : 'rgba(203, 213, 225, 0.7)'
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 1.5,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 0 0 3px rgba(99, 102, 241, 0.15)'
                      : '0 0 0 3px rgba(99, 102, 241, 0.12)'
                }
              }
            }}
            value={searchTerm}
            onChange={onSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="primary" />
                </InputAdornment>
              )
            }}
          />
          <TextField
            placeholder={t('questions.filterChunkNamePlaceholder')}
            variant="outlined"
            size="small"
            sx={{
              width: { xs: '100%', md: 220 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(15, 23, 42, 0.6)'
                    : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                '& fieldset': {
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(129, 140, 248, 0.25)'
                      : 'rgba(203, 213, 225, 0.7)'
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 1.5,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 0 0 3px rgba(99, 102, 241, 0.15)'
                      : '0 0 0 3px rgba(99, 102, 241, 0.12)'
                }
              }
            }}
            value={chunkNameFilter}
            onChange={onChunkNameFilterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="primary" />
                </InputAdornment>
              )
            }}
          />
          <Select
            value={sourceTypeFilter}
            onChange={onSourceTypeFilterChange}
            size="small"
            sx={{
              width: { xs: '100%', md: 180 },
              borderRadius: '12px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.9)',
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(129, 140, 248, 0.25)'
                  : 'rgba(203, 213, 225, 0.7)',
              '&:hover': {
                borderColor: 'primary.main'
              },
              '& .MuiSelect-icon': {
                color: 'primary.main'
              }
            }}
            MenuProps={{
              PaperProps: {
                elevation: 4,
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }
              }
            }}
          >
            <MenuItem value="all">{t('questions.sourceTypeAll')}</MenuItem>
            <MenuItem value="text">{t('questions.sourceTypeText')}</MenuItem>
            <MenuItem value="image">{t('questions.sourceTypeImage')}</MenuItem>
          </Select>
          <Select
            value={answerFilter}
            onChange={onFilterChange}
            size="small"
            sx={{
              width: { xs: '100%', md: 180 },
              borderRadius: '12px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.9)',
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(129, 140, 248, 0.25)'
                  : 'rgba(203, 213, 225, 0.7)',
              '&:hover': {
                borderColor: 'primary.main'
              },
              '& .MuiSelect-icon': {
                color: 'primary.main'
              }
            }}
            MenuProps={{
              PaperProps: {
                elevation: 4,
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }
              }
            }}
          >
            <MenuItem value="all">{t('questions.filterAll')}</MenuItem>
            <MenuItem value="answered">{t('questions.filterAnswered')}</MenuItem>
            <MenuItem value="unanswered">{t('questions.filterUnanswered')}</MenuItem>
          </Select>
        </Stack>
      </Stack>
    </Box>
  );
}
