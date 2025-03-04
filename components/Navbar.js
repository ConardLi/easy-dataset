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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

// 图标
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import DataObjectIcon from '@mui/icons-material/DataObject';

export default function Navbar({ projects = [], currentProject, models = [] }) {
  const [selectedProject, setSelectedProject] = useState(currentProject || '');
  const [selectedModel, setSelectedModel] = useState(models[0]?.id || '');
  const pathname = usePathname();
  const theme = useMuiTheme();
  const { resolvedTheme, setTheme } = useTheme();
  
  // 只在项目详情页显示模块选项卡
  const isProjectDetail = pathname.includes('/projects/') && pathname.split('/').length > 3;
  
  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    // 这里可以添加项目切换的导航逻辑
  };
  
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    // 这里可以添加模型切换的逻辑
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // 获取当前选中的模型信息
  const currentModel = models.find(m => m.id === selectedModel) || null;

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
    >
      <Toolbar sx={{ minHeight: '64px' }}>
        {/* 左侧Logo和项目选择 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 2,
            '&:hover': { opacity: 0.9 }
          }}>
            <Avatar 
              sx={{ 
                bgcolor: 'secondary.main', 
                mr: 1.5,
                width: 36, 
                height: 36 
              }}
              variant="rounded"
            >
              <DataObjectIcon fontSize="small" />
            </Avatar>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                letterSpacing: '-0.5px' 
              }}
              className={theme.palette.mode === 'dark' ? 'gradient-text' : ''}
              color={theme.palette.mode === 'dark' ? 'inherit' : 'white'}
            >
              Easy DataSet
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
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
                选择项目
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* 中间的功能模块导航 */}
        {isProjectDetail && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
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
                label="文本分割" 
                value={`/projects/${selectedProject}/text-split`}
                component={Link}
                href={`/projects/${selectedProject}/text-split`}
              />
              <Tab 
                label="问题列表" 
                value={`/projects/${selectedProject}/questions`}
                component={Link}
                href={`/projects/${selectedProject}/questions`}
              />
              <Tab 
                label="数据集" 
                value={`/projects/${selectedProject}/datasets`}
                component={Link}
                href={`/projects/${selectedProject}/datasets`}
              />
              <Tab 
                label="项目设置" 
                value={`/projects/${selectedProject}/settings`}
                component={Link}
                href={`/projects/${selectedProject}/settings`}
              />
            </Tabs>
          </Box>
        )}
        
        {/* 右侧操作区 */}
        <Box sx={{ display: 'flex', flexGrow: 0, alignItems: 'center', gap: 2 }}>
          {/* 模型选择 */}
          {currentModel ? (
            <Chip
              label={`${currentModel.provider}: ${currentModel.name}`}
              variant="outlined"
              color="secondary"
              size="medium"
              sx={{
                borderRadius: '16px',
                height: '32px',
                border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'}`,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white',
                '& .MuiChip-label': { px: 1 }
              }}
              onClick={() => {
                // 打开模型选择
              }}
            />
          ) : (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={selectedModel}
                onChange={handleModelChange}
                displayEmpty
                variant="outlined"
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  borderRadius: '8px',
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
                  选择模型
                </MenuItem>
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.provider}: {model.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* 主题切换按钮 */}
          <Tooltip title={resolvedTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
