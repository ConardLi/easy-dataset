'use client';

import React, { useState } from 'react';
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
  Divider
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

  // 处理更多菜单打开
  const handleMoreMenuOpen = event => {
    setMoreMenuAnchor(event.currentTarget);
  };

  // 处理更多菜单悬浮打开
  const handleMoreMenuHover = event => {
    setMoreMenuAnchor(event.currentTarget);
  };

  // 关闭更多菜单
  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  // 处理菜单区域的鼠标离开
  const handleMenuMouseLeave = () => {
    setMoreMenuAnchor(null);
  };

  // 处理数据集菜单悬浮打开
  const handleDatasetMenuHover = event => {
    setDatasetMenuAnchor(event.currentTarget);
  };

  // 关闭数据集菜单
  const handleDatasetMenuClose = () => {
    setDatasetMenuAnchor(null);
  };

  // 处理数据集菜单区域的鼠标离开
  const handleDatasetMenuMouseLeave = () => {
    setDatasetMenuAnchor(null);
  };

  // 处理数据源菜单悬浮打开
  const handleSourceMenuHover = event => {
    setSourceMenuAnchor(event.currentTarget);
  };

  // 关闭数据源菜单
  const handleSourceMenuClose = () => {
    setSourceMenuAnchor(null);
  };

  // 处理数据源菜单区域的鼠标离开
  const handleSourceMenuMouseLeave = () => {
    setSourceMenuAnchor(null);
  };

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
          ? '1px solid rgba(99, 102, 241, 0.2)'
          : '1px solid rgba(226, 232, 240, 1)',
        background: isDark
          ? 'rgba(15, 23, 42, 0.8)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 4px 24px rgba(0, 0, 0, 0.2)'
          : '0 4px 24px rgba(15, 23, 42, 0.05)'
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
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '& .MuiSelect-icon': {
                    color: theme.palette.primary.main
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: '2px'
                  },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 1)',
                    boxShadow: isDark
                      ? '0 4px 12px rgba(99, 102, 241, 0.2)'
                      : '0 4px 12px rgba(99, 102, 241, 0.1)'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    elevation: 0,
                    sx: {
                      mt: 1.5,
                      borderRadius: '16px',
                      background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isDark
                        ? '1px solid rgba(99, 102, 241, 0.2)'
                        : '1px solid rgba(226, 232, 240, 1)',
                      boxShadow: isDark
                        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                        : '0 8px 32px rgba(15, 23, 42, 0.1)',
                      '& .MuiMenuItem-root': {
                        borderRadius: '8px',
                        mx: 0.5,
                        my: 0.25,
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
                        },
                        '&.Mui-selected': {
                          bgcolor: theme.palette.gradient.primary,
                          color: '#FFFFFF',
                          '&:hover': {
                            bgcolor: theme.palette.gradient.primary,
                            opacity: 0.9
                          }
                        }
                      }
                    }
                  }
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
                  transition: 'all 0.3s ease',
                  color: theme.palette.text.secondary,
                  padding: '8px 16px',
                  minHeight: '40px',
                  borderRadius: '12px',
                  mx: 0.5,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                    transform: 'translateY(-2px)'
                  }
                },
                '& .Mui-selected': {
                  color: '#FFFFFF',
                  bgcolor: theme.palette.gradient.primary,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                    : '0 4px 16px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    bgcolor: theme.palette.gradient.primary,
                    opacity: 0.9
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
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              borderRadius: '16px',
              minWidth: 180,
              background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(15, 23, 42, 0.1)',
              onMouseLeave: handleSourceMenuMouseLeave,
              '& .MuiMenuItem-root': {
                borderRadius: '8px',
                mx: 0.5,
                my: 0.25,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.gradient.primary,
                  color: '#FFFFFF',
                  '&:hover': {
                    bgcolor: theme.palette.gradient.primary,
                    opacity: 0.9
                  }
                }
              }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          MenuListProps={{
            dense: true,
            onMouseLeave: handleSourceMenuMouseLeave
          }}
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
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              borderRadius: '16px',
              minWidth: 200,
              background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(15, 23, 42, 0.1)',
              onMouseLeave: handleDatasetMenuMouseLeave,
              '& .MuiMenuItem-root': {
                borderRadius: '8px',
                mx: 0.5,
                my: 0.25,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.gradient.primary,
                  color: '#FFFFFF',
                  '&:hover': {
                    bgcolor: theme.palette.gradient.primary,
                    opacity: 0.9
                  }
                }
              }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          MenuListProps={{
            dense: true,
            onMouseLeave: handleDatasetMenuMouseLeave
          }}
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
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              borderRadius: '16px',
              minWidth: 180,
              background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(15, 23, 42, 0.1)',
              onMouseLeave: handleMenuMouseLeave,
              '& .MuiMenuItem-root': {
                borderRadius: '8px',
                mx: 0.5,
                my: 0.25,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.gradient.primary,
                  color: '#FFFFFF',
                  '&:hover': {
                    bgcolor: theme.palette.gradient.primary,
                    opacity: 0.9
                  }
                }
              }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          MenuListProps={{
            dense: true,
            onMouseLeave: handleMenuMouseLeave
          }}
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
          <Tooltip title={resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                color: theme.palette.text.primary,
                p: 1,
                borderRadius: '12px',
                border: isDark
                  ? '1px solid rgba(99, 102, 241, 0.2)'
                  : '1px solid rgba(226, 232, 240, 1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 1)',
                  borderColor: theme.palette.primary.main,
                  boxShadow: isDark
                    ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                    : '0 4px 12px rgba(99, 102, 241, 0.15)',
                  transform: 'translateY(-2px)'
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
