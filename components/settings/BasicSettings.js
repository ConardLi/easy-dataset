'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, Button, TextField, Grid, Card, CardContent, Alert, Snackbar, useTheme } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';

export default function BasicSettings({ projectId }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [projectInfo, setProjectInfo] = useState({
    id: '',
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProjectInfo() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error(t('projects.fetchFailed'));
        }

        const data = await response.json();
        setProjectInfo(data);
      } catch (error) {
        console.error('获取项目信息出错:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectInfo();
  }, [projectId, t]);

  // 处理项目信息变更
  const handleProjectInfoChange = e => {
    const { name, value } = e.target;
    setProjectInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存项目信息
  const handleSaveProjectInfo = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectInfo.name,
          description: projectInfo.description
        })
      });

      if (!response.ok) {
        throw new Error(t('projects.saveFailed'));
      }

      setSuccess(true);
    } catch (error) {
      console.error('保存项目信息出错:', error);
      setError(error.message);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  if (loading) {
    return (
      <Typography sx={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
        {t('common.loading')}
      </Typography>
    );
  }

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
      color: isDark ? '#F8FAFC' : '#0F172A',
      border: `1.5px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
      borderRadius: '12px',
      '&:hover': {
        borderColor: theme.palette.primary.main
      },
      '&.Mui-focused': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'}`
      },
      '&.Mui-disabled': {
        bgcolor: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)',
        color: isDark ? '#94A3B8' : '#64748B'
      }
    },
    '& .MuiInputLabel-root': {
      color: isDark ? '#CBD5E1' : '#475569',
      fontWeight: 600,
      '&.Mui-focused': {
        color: theme.palette.primary.main
      },
      '&.Mui-disabled': {
        color: isDark ? '#64748B' : '#94A3B8'
      }
    },
    '& .MuiInputBase-input': {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontWeight: 500
    },
    '& .MuiFormHelperText-root': {
      color: isDark ? '#94A3B8' : '#64748B',
      fontWeight: 500
    }
  };

  return (
    <Card
      sx={{
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 4px 24px rgba(0, 0, 0, 0.3)'
          : '0 4px 24px rgba(15, 23, 42, 0.08)'
      }}
    >
      <CardContent>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            color: isDark ? '#F8FAFC' : '#0F172A',
            fontWeight: 700,
            mb: 3
          }}
        >
          {t('settings.basicInfo')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('projects.id')}
              value={projectInfo.id}
              disabled
              helperText={t('settings.idNotEditable')}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('projects.name')}
              name="name"
              value={projectInfo.name}
              onChange={handleProjectInfoChange}
              required
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('projects.description')}
              name="description"
              value={projectInfo.description}
              onChange={handleProjectInfoChange}
              multiline
              rows={3}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSaveProjectInfo}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '12px',
                px: 4,
                py: 1.25,
                background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                boxShadow: isDark
                  ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                  : '0 4px 16px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 6px 20px rgba(99, 102, 241, 0.5)'
                    : '0 6px 20px rgba(99, 102, 241, 0.4)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {t('settings.saveBasicInfo')}
            </Button>
          </Grid>
        </Grid>
      </CardContent>

      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {t('settings.saveSuccess')}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
}
