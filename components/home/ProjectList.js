'use client';

import {
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ProjectCard from './ProjectCard';
import { motion } from 'framer-motion';

export default function ProjectList({ projects, onCreateProject }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (event, project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  // 删除项目
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('projects.deleteFailed'));
      }

      // 刷新页面以更新项目列表
      window.location.reload();
    } catch (error) {
      console.error('删除项目失败:', error);
      alert(error.message || t('projects.deleteFailed'));
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        {/* 标题区域 */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1
              }}
            >
              {t('projects.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
              {t('projects.subtitle')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={onCreateProject}
            startIcon={<AddCircleOutlineIcon />}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: '12px',
              background: theme.palette.gradient.primary,
              fontWeight: 600,
              boxShadow: isDark
                ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                : '0 4px 16px rgba(99, 102, 241, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark
                  ? '0 8px 24px rgba(99, 102, 241, 0.5)'
                  : '0 8px 24px rgba(99, 102, 241, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
            >
              {t('projects.createNew')}
            </Button>
        </Box>

        {/* 项目网格 */}
        {projects.length === 0 ? (
          <Paper
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '20px',
              background: isDark
                ? 'rgba(15, 23, 42, 0.8)'
                : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              {t('projects.noProjects')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, opacity: 0.7 }}>
              {t('projects.noProjectsDesc')}
            </Typography>
            <Button
              variant="contained"
              onClick={onCreateProject}
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                background: theme.palette.gradient.primary,
                fontWeight: 600,
                boxShadow: isDark
                  ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                  : '0 4px 16px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 8px 24px rgba(99, 102, 241, 0.5)'
                    : '0 8px 24px rgba(99, 102, 241, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {t('projects.createFirst')}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {projects.map((project, index) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <ProjectCard project={project} onDeleteClick={handleOpenDeleteDialog} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: isDark
              ? 'rgba(15, 23, 42, 0.95)'
              : '#FFFFFF',
            backdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(99, 102, 241, 0.2)'
              : '1px solid rgba(226, 232, 240, 1)'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">{t('projects.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {projectToDelete && (
              <>
                {t('projects.deleteConfirm')}
                <br />
                <Typography component="span" fontWeight="bold" sx={{ mt: 1, display: 'inline-block' }}>
                  {projectToDelete.name}
                </Typography>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained" disabled={loading}>
            {loading ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
