import React, { useState, useEffect } from 'react';
import { Box, Button, Snackbar, Alert, Typography, Link } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import { useTranslation } from 'react-i18next';

const UpdateChecker = () => {
  const { t, i18n } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  // 检查更新
  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/check-update');
      const data = await response.json();
      
      if (data.hasUpdate) {
        setUpdateInfo(data);
        setOpen(true);
      }
    } catch (error) {
      console.error('检查更新失败:', error);
    }
  };

  // 执行更新
  const performUpdate = async () => {
    try {
      setUpdating(true);
      const response = await fetch('/api/update', {
        method: 'POST',
      });
      
      const result = await response.json();
      setUpdateResult(result);
      
      if (result.success) {
        // 更新成功，等待应用重启
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('执行更新失败:', error);
      setUpdateResult({
        success: false,
        message: `执行更新失败: ${error.message}`
      });
    } finally {
      setUpdating(false);
    }
  };

  // 组件挂载时检查更新
  useEffect(() => {
    // 延迟几秒检查更新，避免影响应用启动速度
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // 定期检查更新（每小时一次）
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  if (!updateInfo) return null;

  return (
    <>
      <Button
        color="primary"
        startIcon={<UpdateIcon />}
        onClick={() => setOpen(true)}
        sx={{ ml: 1 }}
      >
        {t('update.newVersion')}
      </Button>
      
      <Snackbar
        open={open}
        autoHideDuration={null}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="h6">
              {t('update.newVersionAvailable')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('update.currentVersion')}: {updateInfo.currentVersion}
            </Typography>
            <Typography variant="body2">
              {t('update.latestVersion')}: {updateInfo.latestVersion}
            </Typography>
            
            {updateResult && (
              <Typography 
                variant="body2" 
                color={updateResult.success ? 'success.main' : 'error.main'}
                sx={{ mt: 1 }}
              >
                {updateResult.message}
              </Typography>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={updating}
                onClick={performUpdate}
              >
                {updating ? t('update.updating') : t('update.updateNow')}
              </Button>
              
              <Link 
                href={updateInfo.releaseUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outlined">
                  {t('update.viewRelease')}
                </Button>
              </Link>
            </Box>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateChecker;
