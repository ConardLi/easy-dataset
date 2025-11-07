'use client';

import {
  Card,
  Box,
  CardActionArea,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import Link from 'next/link';
import { styles } from '@/styles/home';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 项目卡片组件
 * @param {Object} props - 组件属性
 * @param {Object} props.project - 项目数据
 * @param {Function} props.onDeleteClick - 删除按钮点击事件处理函数
 */
export default function ProjectCard({ project, onDeleteClick }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [processingId, setProcessingId] = useState(false);

  // 打开项目目录
  const handleOpenDirectory = async event => {
    event.stopPropagation();
    event.preventDefault();

    if (processingId) return;

    try {
      setProcessingId(true);

      const response = await fetch('/api/projects/open-directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId: project.id })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('migration.openDirectoryFailed'));
      }

      // 成功打开目录，不需要特别处理
    } catch (error) {
      console.error('打开目录错误:', error);
      alert(error.message);
    } finally {
      setProcessingId(false);
    }
  };

  // 处理删除按钮点击
  const handleDeleteClick = event => {
    event.stopPropagation();
    event.preventDefault();
    onDeleteClick(event, project);
  };

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      sx={{
        ...styles.projectCard,
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
          : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: theme.palette.gradient.primary,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        },
        '&:hover': {
          borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)',
          boxShadow: isDark
            ? '0 16px 48px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.2)'
            : '0 12px 40px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.2)',
          '&::before': {
            opacity: 1
          }
        }
      }}
    >
      <Link href={`/projects/${project.id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
        <CardActionArea component="div" sx={{ p: 0 }}>
          <CardContent sx={{ pt: 3, pb: 2, px: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 0.5
              }}
            >
              <Typography variant="h5" component="div" fontWeight="600" sx={{ mt: 1 }}>
                {project.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${project._count.Questions || 0} ${t('projects.questions')}`}
                  sx={{
                    background: isDark
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(99, 102, 241, 0.08)',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
                <Chip
                  size="small"
                  label={`${project._count.Datasets || 0} ${t('projects.datasets')}`}
                  sx={{
                    background: isDark
                      ? 'rgba(6, 182, 212, 0.15)'
                      : 'rgba(6, 182, 212, 0.08)',
                    border: `1px solid ${isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={styles.projectDescription}>
              {project.description}
            </Typography>

            <Divider 
              sx={{ 
                mb: 2,
                borderColor: isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(226, 232, 240, 1)'
              }} 
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {t('projects.lastUpdated')}: {new Date(project.updateAt).toLocaleDateString('zh-CN')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={t('projects.viewDetails')}>
                  <IconButton size="small" color="primary" sx={{ mr: 1 }}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('projects.openDirectory')}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleOpenDirectory}
                    disabled={processingId}
                    sx={{ mr: 1 }}
                  >
                    <FolderOpenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" color="error" onClick={handleDeleteClick}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Link>
    </Card>
  );
}
