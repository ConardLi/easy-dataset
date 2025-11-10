'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Paper, useTheme } from '@mui/material';
import Navbar from '@/components/Navbar';
import { DatasetSiteList } from '@/components/dataset-square/DatasetSiteList';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ParticleBackground from '@/components/home/ParticleBackground';

export default function DatasetSquarePage() {
  const [projects, setProjects] = useState([]);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const defaultProjectId = projects.length ? projects[0]?.id : '';

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
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <main
      style={{
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.background.default,
        minHeight: '100vh'
      }}
    >
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* 导航栏 */}
      <Navbar
        projects={projects}
        currentProject={defaultProjectId}
        forceProjectNavigation={Boolean(defaultProjectId)}
      />
      
      {/* 内容区域 */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 6, md: 10 }
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            position: 'relative',
            zIndex: 2
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4, md: 5 },
                borderRadius: '24px',
                background: isDark
                  ? 'rgba(11, 17, 33, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: isDark
                  ? '1px solid rgba(99, 102, 241, 0.35)'
                  : '1px solid rgba(148, 163, 184, 0.35)',
                boxShadow: isDark
                  ? '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                  : '0 18px 45px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.12)'
              }}
            >
              <DatasetSiteList />
            </Paper>
          </motion.div>
        </Container>
      </Box>
    </main>
  );
}
