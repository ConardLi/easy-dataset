'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ProjectLayout({ children, params }) {
  const router = useRouter();
  const { projectId } = params;
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [t] = useTranslation();
  // 定义获取数据的函数
  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取用户创建的项目详情
      const projectsResponse = await fetch(`/api/projects`);
      if (!projectsResponse.ok) {
        throw new Error(t('projects.fetchFailed'));
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // 获取当前项目详情
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        // 如果项目不存在，跳转到首页
        if (projectResponse.status === 404) {
          router.push('/');
          return;
        }
        throw new Error('获取项目详情失败');
      }
      const projectData = await projectResponse.json();
      setCurrentProject(projectData);
    } catch (error) {
      console.error('加载项目数据出错:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    // 如果 projectId 是 undefined 或 "undefined"，直接重定向到首页
    if (!projectId || projectId === 'undefined') {
      router.push('/');
      return;
    }

    fetchData();
  }, [projectId, router]);

  if (loading) {
    return (
      <main style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: 'transparent',
        minHeight: '100vh'
      }}>
        <Navbar projects={projects} currentProject={projectId} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
            background: 'transparent'
          }}
        >
          <CircularProgress size={40} thickness={4} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>加载项目数据...</Typography>
        </Box>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ 
        overflow: 'hidden', 
        position: 'relative', 
        background: 'transparent',
        minHeight: '100vh'
      }}>
        <Navbar projects={projects} currentProject={projectId} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
            background: 'transparent',
            px: 2
          }}
        >
          <Typography color="error" variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            {t('projects.fetchFailed')}: {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/')} 
            sx={{ 
              mt: 2,
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {t('projects.backToHome')}
          </Button>
        </Box>
      </main>
    );
  }

  return (
    <>
      <Navbar projects={projects} currentProject={projectId} />
      <main>{children}</main>
    </>
  );
}
