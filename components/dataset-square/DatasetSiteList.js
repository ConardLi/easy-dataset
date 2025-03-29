'use client';

import { useState, useEffect } from 'react';
import { Grid, Box, Typography, Skeleton, Divider, Tabs, Tab, Fade, Chip, useTheme, alpha, Paper } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import { DatasetSiteCard } from './DatasetSiteCard';
import sites from '@/constant/sites.json';
import { useTranslation } from 'react-i18next';

export function DatasetSiteList() {
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { t } = useTranslation();

  // 定义类别
  const CATEGORIES = {
    ALL: t('datasetSquare.categories.all'),
    POPULAR: t('datasetSquare.categories.popular'),
    CHINESE: t('datasetSquare.categories.chinese'),
    ENGLISH: t('datasetSquare.categories.english'),
    RESEARCH: t('datasetSquare.categories.research'),
    MULTIMODAL: t('datasetSquare.categories.multimodal')
  };
  const [activeCategory, setActiveCategory] = useState(CATEGORIES.ALL);

  // 模拟加载效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 处理类别切换
  const handleCategoryChange = (event, newValue) => {
    setActiveCategory(newValue);
  };

  // 根据当前选中的类别过滤网站
  const getFilteredSites = () => {
    if (activeCategory === CATEGORIES.ALL) {
      return sites;
    } else if (activeCategory === CATEGORIES.POPULAR) {
      return sites.filter(site => site.labels && site.labels.includes(t('datasetSquare.categories.popular')));
    } else if (activeCategory === CATEGORIES.CHINESE) {
      return sites.filter(site => site.labels && site.labels.includes(t('datasetSquare.categories.chinese')));
    } else if (activeCategory === CATEGORIES.ENGLISH) {
      return sites.filter(site => site.labels && site.labels.includes(t('datasetSquare.categories.english')));
    } else if (activeCategory === CATEGORIES.RESEARCH) {
      return sites.filter(site => site.labels && site.labels.includes(t('datasetSquare.categories.research')));
    } else if (activeCategory === CATEGORIES.MULTIMODAL) {
      return sites.filter(site => site.labels && site.labels.includes(t('datasetSquare.categories.multimodal')));
    }
    return sites;
  };

  const filteredSites = getFilteredSites();

  return (
    <Box sx={{ mt: 4 }}>
      {/* 类别选择器 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2" fontWeight={600}>
            {t('datasetSquare.categoryTitle')}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 0.5,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.dark, 0.1)
                : alpha(theme.palette.primary.light, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            overflow: 'auto'
          }}
        >
          <Tabs
            value={activeCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTab-root': {
                minHeight: 40,
                borderRadius: 2,
                mx: 0.5,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  bgcolor:
                    theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : theme.palette.primary.main,
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : 'white',
                  fontWeight: 600
                }
              }
            }}
          >
            <Tab
              value={CATEGORIES.ALL}
              label={CATEGORIES.ALL}
              icon={<StorageIcon fontSize="small" />}
              iconPosition="start"
            />
            <Tab
              value={CATEGORIES.POPULAR}
              label={CATEGORIES.POPULAR}
              icon={<StarIcon fontSize="small" />}
              iconPosition="start"
            />
            <Tab value={CATEGORIES.CHINESE} label={CATEGORIES.CHINESE} />
            <Tab value={CATEGORIES.ENGLISH} label={CATEGORIES.ENGLISH} />
            <Tab value={CATEGORIES.RESEARCH} label={CATEGORIES.RESEARCH} />
            <Tab value={CATEGORIES.MULTIMODAL} label={CATEGORIES.MULTIMODAL} />
          </Tabs>
        </Paper>
      </Box>

      {/* 数据集网站列表 */}
      <Box sx={{ position: 'relative', minHeight: 300 }}>
        {loading ? (
          // 加载骨架屏
          <Grid container spacing={3}>
            {Array.from(new Array(8)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
                  <Box sx={{ pt: 1.5, px: 0.5 }}>
                    <Skeleton width="80%" height={28} />
                    <Skeleton width="100%" />
                    <Skeleton width="100%" />
                    <Skeleton width="60%" />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Fade in={!loading} timeout={500}>
            <Box>
              {/* 结果数量提示 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  {t('datasetSquare.foundResources', { count: filteredSites.length })}{' '}
                  <Chip
                    label={filteredSites.length}
                    size="small"
                    color="primary"
                    sx={{ mx: 0.5, height: 20, fontSize: '0.75rem' }}
                  />
                </Typography>

                {activeCategory !== CATEGORIES.ALL && (
                  <Chip
                    label={t('datasetSquare.currentFilter', { category: activeCategory })}
                    size="small"
                    onDelete={() => setActiveCategory(CATEGORIES.ALL)}
                    sx={{ borderRadius: 1.5 }}
                  />
                )}
              </Box>

              {filteredSites.length > 0 ? (
                <Grid container spacing={3}>
                  {filteredSites.map((site, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <DatasetSiteCard site={site} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box
                  sx={{
                    py: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.2)
                        : alpha(theme.palette.grey[100], 0.5),
                    borderRadius: 2
                  }}
                >
                  <StorageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('datasetSquare.noDatasets')}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('datasetSquare.tryOtherCategories')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
}
