'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider, useTheme, alpha } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import Navbar from '@/components/Navbar';
import { DatasetSearchBar } from '@/components/dataset-square/DatasetSearchBar';
import { DatasetSiteList } from '@/components/dataset-square/DatasetSiteList';
import { useTranslation } from 'react-i18next';

export default function DatasetSquarePage() {
  const [projects, setProjects] = useState([]);
  const [models, setModels] = useState([]);
  const theme = useTheme();
  const { t } = useTranslation();

  // 获取项目列表和模型列表
  useEffect(() => {
    async function fetchData() {
      try {
        // 获取用户创建的项目详情
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData);
        }

        // 获取模型列表
        const modelsResponse = await fetch('/api/models');
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          setModels(modelsData);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <main>
      {/* 导航栏 */}
      <Navbar projects={projects} models={models} hideModels={true} />

      {/* 头部区域 */}
      <Box
        sx={{
          pt: 10,
          pb: 8,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.6)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.7)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        {/* 背景装饰 */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.15)} 0%, transparent 70%)`,
            filter: 'blur(30px)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.light, 0.15)} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            zIndex: 0
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <StorageIcon
              sx={{
                fontSize: 48,
                mr: 2.5,
                color: theme.palette.mode === 'dark' ? theme.palette.secondary.light : 'white',
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))'
              }}
            />
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                mb: 0,
                letterSpacing: '-0.5px',
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #ffffff 0%, #e0e0e0 100%)'
                    : 'linear-gradient(90deg, #ffffff 30%, #f5f5f5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent'
              }}
            >
              {t('datasetSquare.title')}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            align="center"
            sx={{
              maxWidth: 800,
              mx: 'auto',
              mb: 6,
              color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.9) : '#FFFFFF',
              fontWeight: 400,
              lineHeight: 1.6,
              textShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {t('datasetSquare.subtitle')}
          </Typography>

          {/* 搜索栏组件 */}
          <Box
            sx={{
              maxWidth: 800,
              mx: 'auto',
              position: 'relative',
              zIndex: 10
            }}
          >
            <Paper
              elevation={6}
              sx={{
                width: '100%',
                p: 2.5,
                borderRadius: 3,
                background: 'transparent',
                backdropFilter: 'blur(10px)',
                boxShadow:
                  theme.palette.mode === 'dark' ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.15)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transform: 'translateY(0)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow:
                    theme.palette.mode === 'dark' ? '0 15px 50px rgba(0,0,0,0.4)' : '0 15px 50px rgba(0,0,0,0.2)'
                },
                overflow: 'visible' // 确保不裁剪子元素
              }}
            >
              <DatasetSearchBar />
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 内容区域 */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* 数据集网站列表组件 */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.6)
                : theme.palette.background.paper,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <DatasetSiteList />
        </Paper>
      </Container>
    </main>
  );
}
