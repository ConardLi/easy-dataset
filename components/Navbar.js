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
  Avatar,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ModelSelect from './ModelSelect';
import LanguageSwitcher from './LanguageSwitcher';
import UpdateChecker from './UpdateChecker';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

// 图标
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import DataObjectIcon from '@mui/icons-material/DataObject';
import StorageIcon from '@mui/icons-material/Storage';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Navbar({ projects = [], currentProject, models = [] }) {
  const [selectedProject, setSelectedProject] = useState(currentProject || '');
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState(() => {
    // 从 localStorage 获取上次选择的模型
    const savedModel = localStorage.getItem('selectedModel');
    // 如果保存的模型在当前模型列表中存在，则使用它
    if (savedModel && models.some(m => m.id === savedModel)) {
      return savedModel;
    }
    // 否则使用第一个可用的模型
    return models[0]?.id || '';
  });
  const pathname = usePathname();
  const theme = useMuiTheme();
  const { resolvedTheme, setTheme } = useTheme();

  // 只在项目详情页显示模块选项卡
  const isProjectDetail = pathname.includes('/projects/') && pathname.split('/').length > 3;

  const handleProjectChange = (event) => {
    const newProjectId = event.target.value;
    setSelectedProject(newProjectId);
    // 跳转到新选择的项目页面
    window.location.href = `/projects/${newProjectId}/text-split`;
  };

  const handleModelChange = (event) => {
    if (!event || !event.target) return;
    const newModel = event.target.value;
    setSelectedModel(newModel);
    // 将选择保存到 localStorage
    localStorage.setItem('selectedModel', newModel);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      color={theme.palette.mode === 'dark' ? 'transparent' : 'primary'}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark'
          ? 'background.paper'
          : 'primary.main',

      }}
      style={{ borderRadius: 0, zIndex: 99000 }}
    >
      <Toolbar sx={{ minHeight: '64px' }} style={{ zIndex: 99000 }}>
        {/* 左侧Logo和项目选择 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
          <Box sx={{
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
            <Box
              component="img"
              src="/imgs/logo.svg"
              alt="Easy Dataset Logo"
              sx={{
                width: 28,
                height: 28,
                mr: 1.5
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '-0.5px',
              }}
              style={{ fontSize: '1.1rem' }}
              className={theme.palette.mode === 'dark' ? 'gradient-text' : ''}
              color={theme.palette.mode === 'dark' ? 'inherit' : 'white'}
            >
              Easy DataSet
            </Typography>
          </Box>

          {isProjectDetail && (<FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedProject}
              onChange={handleProjectChange}
              displayEmpty
              variant="outlined"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                '& .MuiSelect-icon': {
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }}
              MenuProps={{
                PaperProps: {
                  elevation: 2,
                  sx: { mt: 1, borderRadius: 2 }
                }
              }}
            >
              <MenuItem value="" disabled>
                {t('projects.selectProject')}
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>)}

        </Box>

        {/* 中间的功能模块导航 */}
        {isProjectDetail && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }} style={{ position: 'absolute', left: '400px' }}>
            <Tabs
              value={pathname}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{
                '& .MuiTab-root': {
                  minWidth: 100,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  opacity: theme.palette.mode === 'dark' ? 0.7 : 0.8,
                  '&:hover': {
                    color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white',
                    opacity: 1
                  }
                },
                '& .Mui-selected': {
                  color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white',
                  opacity: 1,
                  fontWeight: 600
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'
                }
              }}
            >
              <Tab
                label={t('textSplit.title')}
                value={`/projects/${selectedProject}/text-split`}
                component={Link}
                href={`/projects/${selectedProject}/text-split`}
              />
              <Tab
                label={t('questions.title')}
                value={`/projects/${selectedProject}/questions`}
                component={Link}
                href={`/projects/${selectedProject}/questions`}
              />
              <Tab
                label={t('datasets.management')}
                value={`/projects/${selectedProject}/datasets`}
                component={Link}
                href={`/projects/${selectedProject}/datasets`}
              />
              <Tab
                label={t('settings.title')}
                value={`/projects/${selectedProject}/settings`}
                component={Link}
                href={`/projects/${selectedProject}/settings`}
              />
              <Tab
                label={t('playground.title')}
                value={`/projects/${selectedProject}/playground`}
                component={Link}
                href={`/projects/${selectedProject}/playground`}
              />
            </Tabs>
          </Box>
        )}

        {/* 右侧操作区 */}
        <Box sx={{ display: 'flex', flexGrow: 0, alignItems: 'center', gap: 2 }} style={{ position: 'absolute', right: '20px' }}>


          {/* 模型选择 */}
          {
            location.pathname.includes('/projects/') && (<ModelSelect
              models={models}
              selectedModel={selectedModel}
              onChange={handleModelChange}
            />)
          }

          {/* 数据集广场链接 - 改为图标按钮样式 */}
          <Tooltip title={t('datasetSquare.title')}>
            <IconButton
              component={Link}
              href="/dataset-square"
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                p: 1,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
                }
              }}
              style={{ right: '-15px' }}
            >
              <StorageIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* 语言切换器 */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <LanguageSwitcher />
          </Box>
          {/* 主题切换按钮 */}
          <Tooltip title={resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                p: 1,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
                }
              }}
            >
              {resolvedTheme === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* GitHub链接 */}
          <Tooltip title={t('common.visitGitHub')}>
            <IconButton
              onClick={() => window.open('https://github.com/ConardLi/easy-dataset', '_blank')}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                p: 1,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
                }
              }}
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* 更新检查器 */}
          <UpdateChecker />

        </Box>
      </Toolbar>
    </AppBar>
  );
}
