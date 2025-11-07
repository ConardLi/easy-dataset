'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  MenuItem,
  FormControl,
  Select,
  Tabs,
  Tab,
  IconButton,
  useTheme as useMuiTheme,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ModelSelect from './ModelSelect';
import LanguageSwitcher from './LanguageSwitcher';
import UpdateChecker from './UpdateChecker';
import TaskIcon from './TaskIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

// 图标
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import SourceIcon from '@mui/icons-material/Source';
import { toast } from 'sonner';
import axios from 'axios';
import { useSetAtom } from 'jotai/index';
import { modelConfigListAtom, selectedModelInfoAtom } from '@/lib/store';

export default function Navbar({ projects = [], currentProject }) {
  const [selectedProject, setSelectedProject] = useState(currentProject || '');
  const { t } = useTranslation();
  const pathname = usePathname();
  const theme = useMuiTheme();
  const { resolvedTheme, setTheme } = useTheme();
  const setConfigList = useSetAtom(modelConfigListAtom);
  const setSelectedModelInfo = useSetAtom(selectedModelInfoAtom);
  // 只在项目详情页显示模块选项卡
  const isProjectDetail = pathname.includes('/projects/') && pathname.split('/').length > 3;
  // 更多菜单状态
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const isMoreMenuOpen = Boolean(moreMenuAnchor);

  // 数据集菜单状态
  const [datasetMenuAnchor, setDatasetMenuAnchor] = useState(null);
  const isDatasetMenuOpen = Boolean(datasetMenuAnchor);

  // 数据源菜单状态
  const [sourceMenuAnchor, setSourceMenuAnchor] = useState(null);
  const isSourceMenuOpen = Boolean(sourceMenuAnchor);

  // 延迟关闭的定时器
  const closeTimeoutRef = useRef(null);
  const sourceTimeoutRef = useRef(null);
  const datasetTimeoutRef = useRef(null);
  const moreTimeoutRef = useRef(null);

  // 清除所有定时器
  const clearAllTimeouts = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (sourceTimeoutRef.current) clearTimeout(sourceTimeoutRef.current);
    if (datasetTimeoutRef.current) clearTimeout(datasetTimeoutRef.current);
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
  };

  // 关闭所有菜单
  const closeAllMenus = () => {
    clearAllTimeouts();
    setSourceMenuAnchor(null);
    setDatasetMenuAnchor(null);
    setMoreMenuAnchor(null);
  };

  // 处理更多菜单悬浮打开
  const handleMoreMenuHover = event => {
    clearAllTimeouts();
    // 先关闭其他菜单
    setSourceMenuAnchor(null);
    setDatasetMenuAnchor(null);
    // 然后打开当前菜单
    setMoreMenuAnchor(event.currentTarget);
  };

  // 处理更多菜单离开
  const handleMoreMenuLeave = () => {
    moreTimeoutRef.current = setTimeout(() => {
      setMoreMenuAnchor(null);
    }, 200);
  };

  // 关闭更多菜单
  const handleMoreMenuClose = () => {
    clearAllTimeouts();
    setMoreMenuAnchor(null);
  };

  // 处理数据集菜单悬浮打开
  const handleDatasetMenuHover = event => {
    clearAllTimeouts();
    // 先关闭其他菜单
    setSourceMenuAnchor(null);
    setMoreMenuAnchor(null);
    // 然后打开当前菜单
    setDatasetMenuAnchor(event.currentTarget);
  };

  // 处理数据集菜单离开
  const handleDatasetMenuLeave = () => {
    datasetTimeoutRef.current = setTimeout(() => {
      setDatasetMenuAnchor(null);
    }, 200);
  };

  // 关闭数据集菜单
  const handleDatasetMenuClose = () => {
    clearAllTimeouts();
    setDatasetMenuAnchor(null);
  };

  // 处理数据源菜单悬浮打开
  const handleSourceMenuHover = event => {
    clearAllTimeouts();
    // 先关闭其他菜单
    setDatasetMenuAnchor(null);
    setMoreMenuAnchor(null);
    // 然后打开当前菜单
    setSourceMenuAnchor(event.currentTarget);
  };

  // 处理数据源菜单离开
  const handleSourceMenuLeave = () => {
    sourceTimeoutRef.current = setTimeout(() => {
      setSourceMenuAnchor(null);
    }, 200);
  };

  // 关闭数据源菜单
  const handleSourceMenuClose = () => {
    clearAllTimeouts();
    setSourceMenuAnchor(null);
  };

  // 菜单保持打开
  const handleMenuEnter = () => {
    clearAllTimeouts();
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  const handleProjectChange = event => {
    const newProjectId = event.target.value;
    setSelectedProject(newProjectId);
    axios
      .get(`/api/projects/${newProjectId}/model-config`)
      .then(response => {
        setConfigList(response.data.data);
        if (response.data.defaultModelConfigId) {
          setSelectedModelInfo(response.data.data.find(item => item.id === response.data.defaultModelConfigId));
        } else {
          setSelectedModelInfo('');
        }
      })
      .catch(error => {
        toast.error('get model list error');
      });
    // 跳转到新选择的项目页面
    window.location.href = `/projects/${newProjectId}/text-split`;
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        borderBottom: isDark
          ? '1px solid rgba(99, 102, 241, 0.15)'
          : '1px solid rgba(99, 102, 241, 0.15)',
        background: isDark
          ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: isDark
          ? '0 1px 0 0 rgba(99, 102, 241, 0.1) inset, 0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 1px 0 0 rgba(255, 255, 255, 0.8) inset, 0 8px 32px rgba(15, 23, 42, 0.08)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
          opacity: 0.6
        }
      }}
      style={{ borderRadius: 0, zIndex: 99000 }}
    >
      <Toolbar
        sx={{
          height: '56px',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 }
        }}
        style={{ zIndex: 99000 }}
      >
        {/* 左侧Logo和项目选择 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              '&:hover': { opacity: 0.9 }
            }}
            style={{ cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => {
              window.location.href = '/';
            }}
          >
            {/* logo removed per rebrand */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.5px',
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent'
              }}
              style={{ fontSize: '1.1rem' }}
            >
              HKGAI Dataset Generation
            </Typography>
          </Box>

          {isProjectDetail && (
            <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
              <Select
                value={selectedProject}
                onChange={handleProjectChange}
                displayEmpty
                variant="outlined"
                sx={{
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
                  borderRadius: '12px',
                  color: isDark ? theme.palette.text.primary : '#1E293B',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  height: '36px',
                  '& .MuiSelect-icon': {
                    color: theme.palette.primary.main,
                    transition: 'transform 0.3s ease'
                  },
                  '&.Mui-expanded .MuiSelect-icon': {
                    transform: 'rotate(180deg)'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)',
                    borderWidth: '1.5px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: '2px',
                    boxShadow: `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'}`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#F8F9FA',
                    transform: 'translateY(-1px)',
                    boxShadow: isDark
                      ? '0 4px 12px rgba(99, 102, 241, 0.25)'
                      : '0 4px 12px rgba(99, 102, 241, 0.2)'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    elevation: 0,
                    sx: {
                      mt: 1.5,
                      borderRadius: '16px',
                      minWidth: 180,
                      background: isDark
                        ? '#1E293B'
                        : '#FFFFFF !important',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      border: isDark
                        ? '1px solid rgba(99, 102, 241, 0.35)'
                        : '1px solid rgba(99, 102, 241, 0.3)',
                      boxShadow: isDark
                        ? '0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.15)'
                        : '0 12px 48px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.15)',
                      overflow: 'hidden',
                      py: 1,
                      '& .MuiList-root': {
                        py: 0.5,
                        bgcolor: 'transparent'
                      },
                      '& .MuiMenuItem-root': {
                        borderRadius: '10px',
                        mx: 1,
                        my: 0.5,
                        minHeight: '52px',
                        px: 2.5,
                        py: 1.5,
                        color: isDark ? '#F8FAFC' : '#0F172A !important',
                        fontSize: '1rem',
                        fontWeight: 700,
                        lineHeight: 1.6,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '0.02em',
                        bgcolor: 'transparent',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.14)',
                          color: isDark ? '#FFFFFF !important' : `${theme.palette.primary.main} !important`,
                          transform: 'translateX(4px)',
                          boxShadow: isDark
                            ? '0 2px 10px rgba(99, 102, 241, 0.3)'
                            : '0 2px 10px rgba(99, 102, 241, 0.2)',
                          fontWeight: 700
                        },
                        '&.Mui-selected': {
                          bgcolor: `${theme.palette.gradient.primary} !important`,
                          color: '#FFFFFF !important',
                          fontWeight: 700,
                          boxShadow: isDark
                            ? '0 4px 16px rgba(99, 102, 241, 0.45)'
                            : '0 4px 16px rgba(99, 102, 241, 0.4)',
                          '&:hover': {
                            bgcolor: `${theme.palette.gradient.primary} !important`,
                            opacity: 0.95,
                            transform: 'translateX(4px) scale(1.02)',
                            color: '#FFFFFF !important'
                          }
                        },
                        '&.Mui-disabled': {
                          color: `${isDark ? '#94A3B8' : '#475569'} !important`,
                          bgcolor: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)',
                          opacity: 1,
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }
                      }
                    }
                  },
                  TransitionComponent: Fade,
                  transitionDuration: 200
                }}
              >
                <MenuItem value="" disabled>
                  {t('projects.selectProject')}
                </MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* 中间的功能模块导航 - 使用Flex布局居中 */}
        {isProjectDetail && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', ml: 2, mr: 2 }}>
            <Tabs
              value={
                pathname.includes('/settings') || pathname.includes('/playground') || pathname.includes('/datasets-sq')
                  ? 'more'
                  : pathname.includes('/datasets') ||
                      pathname.includes('/multi-turn') ||
                      pathname.includes('/image-datasets')
                    ? 'datasets'
                    : pathname.includes('/text-split') || pathname.includes('/images')
                      ? 'source'
                      : pathname
              }
              textColor="inherit"
              indicatorColor="secondary"
              sx={{
                '& .MuiTabs-indicator': {
                  display: 'none'
                },
                '& .MuiTab-root': {
                  minWidth: 100,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: isDark ? theme.palette.text.secondary : '#475569',
                  padding: '10px 18px',
                  minHeight: '40px',
                  borderRadius: '12px',
                  mx: 0.5,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: '2px',
                    background: theme.palette.gradient.primary,
                    transition: 'width 0.3s ease',
                    borderRadius: '2px'
                  },
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.1)',
                    transform: 'translateY(-2px)',
                    '&::before': {
                      width: '60%'
                    }
                  }
                },
                '& .Mui-selected': {
                  color: '#FFFFFF',
                  background: theme.palette.gradient.primary,
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: isDark
                    ? '0 6px 20px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                    : '0 6px 20px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.15)',
                  transform: 'translateY(-1px)',
                  '&::before': {
                    width: '80%'
                  },
                  '&:hover': {
                    background: theme.palette.gradient.primary,
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.95,
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 8px 24px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.25)'
                      : '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                  }
                }
              }}
            >
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
                iconPosition="start"
                label={t('common.dataSource')}
                value="source"
                onMouseEnter={handleSourceMenuHover}
                onMouseLeave={handleSourceMenuLeave}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <TokenOutlinedIcon fontSize="small" />
                  </Box>
                }
                iconPosition="start"
                label={t('distill.title')}
                value={`/projects/${selectedProject}/distill`}
                component={Link}
                href={`/projects/${selectedProject}/distill`}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <QuestionAnswerOutlinedIcon fontSize="small" />
                  </Box>
                }
                iconPosition="start"
                label={t('questions.title')}
                value={`/projects/${selectedProject}/questions`}
                component={Link}
                href={`/projects/${selectedProject}/questions`}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
                iconPosition="start"
                label={t('datasets.management')}
                value="datasets"
                onMouseEnter={handleDatasetMenuHover}
                onMouseLeave={handleDatasetMenuLeave}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
                iconPosition="start"
                label={t('common.more')}
                onMouseEnter={handleMoreMenuHover}
                onMouseLeave={handleMoreMenuLeave}
                value="more"
              />
            </Tabs>
          </Box>
        )}

        {/* 数据源菜单 */}
        <Menu
          anchorEl={sourceMenuAnchor}
          open={isSourceMenuOpen}
          onClose={handleSourceMenuClose}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleSourceMenuLeave}
          TransitionComponent={Fade}
          transitionDuration={200}
          MenuListProps={{
            dense: true,
            onMouseEnter: handleMenuEnter,
            onMouseLeave: handleSourceMenuLeave,
            sx: { py: 1 }
          }}
          PaperProps={{
            elevation: 0,
            onMouseEnter: handleMenuEnter,
            onMouseLeave: handleSourceMenuLeave,
            sx: {
              mt: 1,
              borderRadius: '16px',
              minWidth: 200,
              background: isDark
                ? '#1E293B'
                : '#FFFFFF',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: isDark
                ? '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 12px 48px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
              overflow: 'hidden',
              '& .MuiMenuItem-root': {
                borderRadius: '10px',
                mx: 0.75,
                my: 0.5,
                minHeight: '48px',
                px: 2,
                py: 1.25,
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontSize: '0.9375rem',
                fontWeight: 600,
                lineHeight: 1.6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.01em',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                  color: isDark ? '#FFFFFF' : theme.palette.primary.main,
                  transform: 'translateX(4px)',
                  boxShadow: isDark
                    ? '0 2px 8px rgba(99, 102, 241, 0.25)'
                    : '0 2px 8px rgba(99, 102, 241, 0.18)'
                },
                '&.Mui-selected': {
                  background: theme.palette.gradient.primary,
                  backgroundColor: theme.palette.primary.main,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                    : '0 4px 16px rgba(99, 102, 241, 0.35)',
                  '&:hover': {
                    background: theme.palette.gradient.primary,
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.95,
                    transform: 'translateX(4px) scale(1.02)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#FFFFFF'
                  }
                },
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                  color: isDark ? '#CBD5E1' : '#475569',
                  transition: 'color 0.2s ease'
                },
                '&:hover .MuiListItemIcon-root': {
                  color: isDark ? '#FFFFFF' : theme.palette.primary.main
                },
                '& .MuiListItemText-primary': {
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  lineHeight: 1.6,
                  color: 'inherit',
                  letterSpacing: '0.01em'
                }
              },
              '& .MuiDivider-root': {
                borderColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.2)',
                mx: 1,
                my: 0.5
              }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/text-split`}
            onClick={handleSourceMenuClose}
            selected={pathname === `/projects/${selectedProject}/text-split`}
          >
            <ListItemIcon>
              <DescriptionOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('textSplit.title')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/images`}
            onClick={handleSourceMenuClose}
            selected={pathname === `/projects/${selectedProject}/images`}
          >
            <ListItemIcon>
              <ImageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('images.title')} />
          </MenuItem>
        </Menu>

        {/* 数据集菜单 */}
        <Menu
          anchorEl={datasetMenuAnchor}
          open={isDatasetMenuOpen}
          onClose={handleDatasetMenuClose}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleDatasetMenuLeave}
          TransitionComponent={Fade}
          transitionDuration={200}
          MenuListProps={{
            dense: true,
            onMouseEnter: handleMenuEnter,
            onMouseLeave: handleDatasetMenuLeave,
            sx: { py: 1 }
          }}
          PaperProps={{
            elevation: 0,
            onMouseEnter: handleMenuEnter,
            onMouseLeave: handleDatasetMenuLeave,
            sx: {
              mt: 1,
              borderRadius: '16px',
              minWidth: 220,
              background: isDark
                ? '#1E293B'
                : '#FFFFFF',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: isDark
                ? '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 12px 48px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
              overflow: 'hidden',
              '& .MuiMenuItem-root': {
                borderRadius: '10px',
                mx: 0.75,
                my: 0.5,
                minHeight: '48px',
                px: 2,
                py: 1.25,
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontSize: '0.9375rem',
                fontWeight: 600,
                lineHeight: 1.6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.01em',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                  color: isDark ? '#FFFFFF' : theme.palette.primary.main,
                  transform: 'translateX(4px)',
                  boxShadow: isDark
                    ? '0 2px 8px rgba(99, 102, 241, 0.25)'
                    : '0 2px 8px rgba(99, 102, 241, 0.18)'
                },
                '&.Mui-selected': {
                  background: theme.palette.gradient.primary,
                  backgroundColor: theme.palette.primary.main,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                    : '0 4px 16px rgba(99, 102, 241, 0.35)',
                  '&:hover': {
                    background: theme.palette.gradient.primary,
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.95,
                    transform: 'translateX(4px) scale(1.02)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#FFFFFF'
                  }
                },
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                  color: isDark ? '#CBD5E1' : '#475569',
                  transition: 'color 0.2s ease'
                },
                '&:hover .MuiListItemIcon-root': {
                  color: isDark ? '#FFFFFF' : theme.palette.primary.main
                },
                '& .MuiListItemText-primary': {
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  lineHeight: 1.6,
                  color: 'inherit',
                  letterSpacing: '0.01em'
                }
              },
              '& .MuiDivider-root': {
                borderColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.2)',
                mx: 1,
                my: 0.5
              }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/datasets`}
            onClick={handleDatasetMenuClose}
            selected={pathname === `/projects/${selectedProject}/datasets`}
          >
            <ListItemIcon>
              <DatasetOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasets.singleTurn', '单轮问答数据集')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/multi-turn`}
            onClick={handleDatasetMenuClose}
            selected={pathname === `/projects/${selectedProject}/multi-turn`}
          >
            <ListItemIcon>
              <ChatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasets.multiTurn', '多轮对话数据集')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/image-datasets`}
            onClick={handleDatasetMenuClose}
            selected={pathname === `/projects/${selectedProject}/image-datasets`}
          >
            <ListItemIcon>
              <ImageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasets.imageQA', '图片问答数据集')} />
          </MenuItem>
        </Menu>

        {/* 更多菜单 */}
        <Menu
          anchorEl={moreMenuAnchor}
          open={isMoreMenuOpen}
          onClose={handleMoreMenuClose}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMoreMenuLeave}
          TransitionComponent={Fade}
          transitionDuration={200}
          MenuListProps={{
            dense: true,
            onMouseEnter: handleMenuEnter,
            onMouseLeave: handleMoreMenuLeave,
            sx: { py: 1 }
          }}
          PaperProps={{
            elevation: 0,
            onMouseEnter: handleMenuEnter,
            onMouseLeave: handleMoreMenuLeave,
            sx: {
              mt: 1,
              borderRadius: '16px',
              minWidth: 200,
              background: isDark
                ? '#1E293B'
                : '#FFFFFF',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: isDark
                ? '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 12px 48px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
              overflow: 'hidden',
              '& .MuiMenuItem-root': {
                borderRadius: '10px',
                mx: 0.75,
                my: 0.5,
                minHeight: '48px',
                px: 2,
                py: 1.25,
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontSize: '0.9375rem',
                fontWeight: 600,
                lineHeight: 1.6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.01em',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                  color: isDark ? '#FFFFFF' : theme.palette.primary.main,
                  transform: 'translateX(4px)',
                  boxShadow: isDark
                    ? '0 2px 8px rgba(99, 102, 241, 0.25)'
                    : '0 2px 8px rgba(99, 102, 241, 0.18)'
                },
                '&.Mui-selected': {
                  background: theme.palette.gradient.primary,
                  backgroundColor: theme.palette.primary.main,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                    : '0 4px 16px rgba(99, 102, 241, 0.35)',
                  '&:hover': {
                    background: theme.palette.gradient.primary,
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.95,
                    transform: 'translateX(4px) scale(1.02)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#FFFFFF'
                  }
                },
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                  color: isDark ? '#CBD5E1' : '#475569',
                  transition: 'color 0.2s ease'
                },
                '&:hover .MuiListItemIcon-root': {
                  color: isDark ? '#FFFFFF' : theme.palette.primary.main
                },
                '& .MuiListItemText-primary': {
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  lineHeight: 1.6,
                  color: 'inherit',
                  letterSpacing: '0.01em'
                }
              },
              '& .MuiDivider-root': {
                borderColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.2)',
                mx: 1,
                my: 0.5
              }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/settings`}
            onClick={handleMoreMenuClose}
            selected={pathname === `/projects/${selectedProject}/settings`}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('settings.title')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/playground`}
            onClick={handleMoreMenuClose}
            selected={pathname === `/projects/${selectedProject}/playground`}
          >
            <ListItemIcon>
              <ScienceOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('playground.title')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href="/dataset-square"
            onClick={handleMoreMenuClose}
            selected={pathname === `/dataset-square`}
          >
            <ListItemIcon>
              <StorageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasetSquare.title')} />
          </MenuItem>
        </Menu>

        {/* 右侧操作区 - 使用Flex布局 */}
        <Box sx={{ display: 'flex', flexGrow: 0, alignItems: 'center', gap: 1.5 }}>
          {/* 模型选择 */}
          {isProjectDetail && <ModelSelect projectId={selectedProject} />}
          {/* 任务图标 - 仅在项目页面显示 */}
          {isProjectDetail && <TaskIcon theme={theme} projectId={selectedProject} />}

          {/* 语言切换器 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LanguageSwitcher />
          </Box>
          {/* 主题切换按钮 */}
          <Tooltip
            title={resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
            arrow
            placement="bottom"
          >
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
                color: isDark ? theme.palette.text.primary : '#1E293B',
                p: 1.25,
                borderRadius: '12px',
                border: isDark
                  ? '1px solid rgba(99, 102, 241, 0.2)'
                  : '1px solid rgba(99, 102, 241, 0.25)',
                width: '40px',
                height: '40px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F8F9FA',
                  borderColor: theme.palette.primary.main,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(99, 102, 241, 0.35), 0 0 0 3px rgba(99, 102, 241, 0.1)'
                    : '0 4px 16px rgba(99, 102, 241, 0.25), 0 0 0 3px rgba(99, 102, 241, 0.1)',
                  transform: 'translateY(-2px) rotate(15deg)',
                  '& svg': {
                    filter: `drop-shadow(0 0 8px ${theme.palette.primary.main}60)`
                  }
                },
                '& svg': {
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {resolvedTheme === 'dark' ? (
                <LightModeOutlinedIcon fontSize="small" />
              ) : (
                <DarkModeOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          

          {/* 更新检查器 */}
          <UpdateChecker />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
