'use client';

import { Paper, Grid, Box, Typography, useMediaQuery, Avatar } from '@mui/material';
import { styles } from '@/styles/home';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';

// 默认模型列表
const mockModels = [
  { id: 'deepseek-r1', provider: 'Ollama', name: 'DeepSeek-R1' },
  { id: 'gpt-3.5-turbo-openai', provider: 'OpenAI', name: 'gpt-3.5-turbo' },
  { id: 'gpt-3.5-turbo-guiji', provider: 'Guiji', name: 'gpt-3.5-turbo' },
  { id: 'glm-4-flash', provider: 'Zhipu AI', name: 'GLM-4-Flash' }
];

export default function StatsCard({ projects }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 统计卡片数据
  const statsItems = [
    {
      value: projects.length,
      label: t('stats.ongoingProjects'),
      color: 'primary',
      icon: <FolderOpenIcon />
    },
    {
      value: projects.reduce((sum, project) => sum + (project.questionsCount || 0), 0),
      label: t('stats.questionCount'),
      color: 'secondary',
      icon: <QuestionAnswerIcon />
    },
    {
      value: projects.reduce((sum, project) => sum + (project.datasetsCount || 0), 0),
      label: t('stats.generatedDatasets'),
      color: 'success',
      icon: <StorageIcon />
    },
    {
      value: mockModels.length,
      label: t('stats.supportedModels'),
      color: 'warning',
      icon: <MemoryIcon />
    }
  ];

  return (
    <Paper
      elevation={0}
      sx={styles.statsCard(theme)}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Grid container spacing={3}>
        {statsItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 10px 20px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'}`
                }
              }}
              component={motion.div}
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mb: 2,
                  bgcolor: theme.palette[item.color].main,
                  color: '#fff',
                  boxShadow: `0 4px 12px ${theme.palette[item.color].main}40`
                }}
              >
                {item.icon}
              </Avatar>
              <Typography
                color={item.color + '.main'}
                variant={isMobile ? 'h3' : 'h2'}
                fontWeight="bold"
                sx={{
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette[item.color].main} 0%, ${theme.palette[item.color].light} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textFillColor: 'transparent'
                }}
              >
                {item.value}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="500" sx={{ opacity: 0.8 }}>
                {item.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
