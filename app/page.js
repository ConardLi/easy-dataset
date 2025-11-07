'use client';

import { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Stack, useTheme } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/home/HeroSection';
import StatsCard from '@/components/home/StatsCard';
import ProjectList from '@/components/home/ProjectList';
import CreateProjectDialog from '@/components/home/CreateProjectDialog';
import MigrationDialog from '@/components/home/MigrationDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [unmigratedProjects, setUnmigratedProjects] = useState([]);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

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

        // 检查是否有未迁移的项目
        await checkUnmigratedProjects();
      } catch (error) {
        console.error(t('projects.fetchError'), String(error));
        setError(String(error));
      } finally {
        setLoading(false);
      }
    }

    // 检查未迁移的项目
    async function checkUnmigratedProjects() {
      try {
        const response = await fetch('/api/projects/unmigrated');

        if (!response.ok) {
          console.error('检查未迁移项目失败');
          return;
        }

        const { success, data } = await response.json();

        if (success && Array.isArray(data) && data.length > 0) {
          setUnmigratedProjects(data);
          setMigrationDialogOpen(true);
        }
      } catch (error) {
        console.error('检查未迁移项目出错', error);
      }
    }

    fetchProjects();
  }, []);

  const theme = useTheme();

  return (
    <main style={{ 
      overflow: 'hidden', 
      position: 'relative', 
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* Tech layered background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      >
        {/* subtle grid */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: theme.palette.mode === 'dark'
              ? `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`
              : `linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
        {/* gradient blobs */}
        <Box sx={{ position: 'absolute', top: -160, left: -120, width: 420, height: 420, borderRadius: '50%', filter: 'blur(80px)', background: theme.palette.gradient.primary, opacity: theme.palette.mode === 'dark' ? 0.18 : 0.12 }} />
        <Box sx={{ position: 'absolute', bottom: -180, right: -140, width: 500, height: 500, borderRadius: '50%', filter: 'blur(100px)', background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.main})`, opacity: theme.palette.mode === 'dark' ? 0.18 : 0.12 }} />
        {/* scanline shimmer */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
            opacity: 0.6,
            boxShadow: `0 0 24px ${theme.palette.primary.main}40`
          }}
        />
      </Box>
      <Navbar projects={projects} />

      <HeroSection onCreateProject={() => setCreateDialogOpen(true)} />

      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: -4, md: -6 },
          mb: { xs: 6, md: 8 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <StatsCard projects={projects} />

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

      {/* 项目迁移对话框 */}
      <MigrationDialog
        open={migrationDialogOpen}
        onClose={() => setMigrationDialogOpen(false)}
        projectIds={unmigratedProjects}
      />
    </main>
  );
}
