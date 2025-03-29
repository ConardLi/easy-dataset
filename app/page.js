'use client';

import { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Stack, useTheme } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/home/HeroSection';
import StatsCard from '@/components/home/StatsCard';
import ProjectList from '@/components/home/ProjectList';
import CreateProjectDialog from '@/components/home/CreateProjectDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        // 获取用户创建的项目详情
        const response = await fetch(`/api/projects`);

        if (!response.ok) {
          throw new Error(t('projects.fetchFailed'));
        }

        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error(t('projects.fetchError'), error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const theme = useTheme();

  return (
    <main style={{ overflow: 'hidden', position: 'relative' }}>
      <Navbar projects={projects} models={[]} />

      <HeroSection onCreateProject={() => setCreateDialogOpen(true)} />

      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 6, md: 8 },
          mb: { xs: 4, md: 6 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* <StatsCard projects={projects} /> */}

        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mt: 6,
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              {t('projects.loading')}
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            sx={{
              mt: 4,
              p: 3,
              bgcolor: 'error.light',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ErrorOutlineIcon color="error" />
              <Typography color="error.dark">
                {t('projects.fetchFailed')}: {error}
              </Typography>
            </Stack>
          </Box>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProjectList projects={projects} onCreateProject={() => setCreateDialogOpen(true)} />
          </motion.div>
        )}
      </Container>

      <CreateProjectDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
    </main>
  );
}
