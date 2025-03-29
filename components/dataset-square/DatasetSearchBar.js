'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  ClickAwayListener,
  Fade,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LaunchIcon from '@mui/icons-material/Launch';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import sites from '@/constant/sites.json';
import { useTranslation } from 'react-i18next';

export function DatasetSearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const theme = useTheme();
  const { t } = useTranslation();

  // 从 localStorage 加载最近搜索
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentDatasetSearches');
    if (savedSearches) {
      try {
        const searches = JSON.parse(savedSearches);
        setRecentSearches(searches);
      } catch (e) {
        console.error('解析最近搜索失败', e);
      }
    }
  }, []);

  // 处理搜索输入变化
  const handleSearchChange = event => {
    setSearchQuery(event.target.value);
    if (event.target.value) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理回车搜索
  const handleSearchSubmit = event => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      // 默认使用第一个搜索引擎
      if (sites.length > 0) {
        handleSuggestionClick(sites[0]);
      }
    }
  };

  // 保存最近搜索
  const saveRecentSearch = query => {
    if (!query.trim()) return;

    // 添加到最近搜索并去重
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);

    // 保存到 localStorage
    try {
      localStorage.setItem('recentDatasetSearches', JSON.stringify(updatedSearches));
    } catch (e) {
      console.error('保存最近搜索失败', e);
    }
  };

  // 处理点击搜索建议
  const handleSuggestionClick = site => {
    if (searchQuery.trim()) {
      // 根据不同网站处理搜索参数
      let searchUrl = site.link;

      // 如果链接中不包含问号，则添加搜索参数
      if (site.link.includes('huggingface.co')) {
        searchUrl = `${site.link}?sort=trending&search=${encodeURIComponent(searchQuery)}`;
      } else if (site.link.includes('kaggle.com')) {
        searchUrl = `${site.link}?search=${encodeURIComponent(searchQuery)}`;
      } else if (site.link.includes('datasetsearch.research.google.com')) {
        searchUrl = `${site.link}/search?query=${encodeURIComponent(searchQuery)}&src=0`;
      } else if (site.link.includes('paperswithcode.com')) {
        searchUrl = `${site.link}?q=${encodeURIComponent(searchQuery)}`;
      } else if (site.link.includes('modelscope.cn')) {
        searchUrl = `${site.link}?query=${encodeURIComponent(searchQuery)}`;
      } else if (site.link.includes('opendatalab.com')) {
        searchUrl = `${site.link}?keywords=${encodeURIComponent(searchQuery)}`;
      } else if (site.link.includes('tianchi.aliyun.com')) {
        searchUrl = `${site.link}?q=${encodeURIComponent(searchQuery)}`;
      } else {
        // 默认处理方式，在URL后添加搜索参数
        searchUrl = `${site.link}${site.link.includes('?') ? '&' : '?'}search=${encodeURIComponent(searchQuery)}`;
      }

      // 保存最近搜索
      saveRecentSearch(searchQuery);

      window.open(searchUrl, '_blank');
    }
    setShowSuggestions(false);
  };

  // 处理点击外部关闭建议
  const handleClickAway = event => {
    // 确保点击的不是建议框本身
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%', zIndex: 1300 }} ref={searchRef}>
        <TextField
          fullWidth
          placeholder={t('datasetSquare.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchSubmit}
          onClick={() => searchQuery && setShowSuggestions(true)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            sx: {
              height: 56,
              borderRadius: 3,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.default, 0.6)
                  : alpha(theme.palette.background.default, 0.8),
              backdropFilter: 'blur(8px)',
              px: 2,
              transition: 'all 0.3s ease',
              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.15)}`,
              '&.MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'transparent'
                },
                '&:hover fieldset': {
                  borderColor: 'transparent'
                },
                '&.Mui-focused': {
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.common.white, 0.95)
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent'
                }
              }
            }
          }}
          sx={{
            mb: 1,
            '& .MuiInputBase-input': {
              fontSize: '1rem',
              fontWeight: 500,
              color: theme.palette.text.primary
            },
            '& .MuiInputBase-input::placeholder': {
              color: alpha(theme.palette.text.primary, 0.6),
              opacity: 0.7
            }
          }}
        />

        {/* 搜索建议下拉框 - 使用绝对定位确保不被裁剪 */}
        {showSuggestions && searchQuery && (
          <Box
            ref={suggestionsRef}
            sx={{
              position: 'absolute',
              width: '100%',
              zIndex: 9999,
              top: 'calc(100% + 8px)',
              left: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              pointerEvents: 'auto' // 确保可以点击
            }}
          >
            <Fade in={showSuggestions}>
              <Paper
                elevation={6}
                sx={{
                  width: '100%',
                  maxHeight: 350,
                  overflow: 'auto',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  position: 'relative'
                }}
              >
                <List>
                  {sites.slice(0, 5).map((site, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        onClick={() => handleSuggestionClick(site)}
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    mr: 1.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                  }}
                                >
                                  <TravelExploreIcon fontSize="small" />
                                </Avatar>
                                <Typography>
                                  {t('datasetSquare.searchVia')} <strong>{site.name}</strong> Search
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                  "{searchQuery}"
                                </Typography>
                                <LaunchIcon fontSize="small" color="action" />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Fade>
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
}
