import React, { useState, useEffect } from 'react';
import { Box, Button, Snackbar, Alert, Typography, Link, CircularProgress, LinearProgress } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import { useTranslation } from 'react-i18next';

const UpdateChecker = () => {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // 检查更新
  const checkForUpdates = async () => {
    if (!window.electron?.updater) {
      console.warn('Update feature is not available, possibly running in browser environment');
      return;
    }

    try {
      setChecking(true);
      setUpdateError(null);

      const result = await window.electron.updater.checkForUpdates();
      console.log('Update check result:', result);

      // 返回当前版本信息
      if (result) {
        setUpdateInfo(prev => ({
          ...prev,
          currentVersion: result.currentVersion
        }));
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      // setUpdateError(error.message || 'Failed to check for updates');
    } finally {
      setChecking(false);
    }
  };

  // 下载更新
  const downloadUpdate = async () => {
    if (!window.electron?.updater) return;

    try {
      setDownloading(true);
      setUpdateError(null);
      await window.electron.updater.downloadUpdate();
    } catch (error) {
      console.error('下载更新失败:', error);
      setUpdateError(error.message || '下载更新失败');
      setDownloading(false);
    }
  };

  // 安装更新
  const installUpdate = async () => {
    if (!window.electron?.updater) return;

    try {
      await window.electron.updater.installUpdate();
    } catch (error) {
      console.error('Failed to install update:', error);
      // setUpdateError(error.message || 'Failed to install update');
    }
  };

  // 设置更新事件监听
  useEffect(() => {
    if (!window.electron?.updater) return;

    // 有可用更新
    const removeUpdateAvailable = window.electron.updater.onUpdateAvailable(info => {
      console.log('发现新版本:', info);
      setUpdateAvailable(true);
      setUpdateInfo(prev => ({
        ...prev,
        ...info,
        releaseUrl: `https://github.com/ConardLi/easy-dataset/releases`
      }));
      setOpen(true);
    });

    // 没有可用更新
    const removeUpdateNotAvailable = window.electron.updater.onUpdateNotAvailable(() => {
      console.log('没有可用更新');
      setUpdateAvailable(false);
    });

    // 更新错误
    const removeUpdateError = window.electron.updater.onUpdateError(error => {
      console.error('更新错误:', error);
      // setUpdateError(error);
    });

    // 下载进度
    const removeDownloadProgress = window.electron.updater.onDownloadProgress(progress => {
      console.log('下载进度:', progress);
      setDownloadProgress(progress.percent || 0);
    });

    // 更新下载完成
    const removeUpdateDownloaded = window.electron.updater.onUpdateDownloaded(info => {
      console.log('更新下载完成:', info);
      setDownloading(false);
      setUpdateDownloaded(true);
    });

    // 组件挂载时检查更新
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // 清理函数
    return () => {
      clearTimeout(timer);
      removeUpdateAvailable();
      removeUpdateNotAvailable();
      removeUpdateError();
      removeDownloadProgress();
      removeUpdateDownloaded();
    };
  }, []);

  // 定期检查更新（每小时一次）
  useEffect(() => {
    if (!window.electron?.updater) return;

    const interval = setInterval(
      () => {
        checkForUpdates();
      },
      60 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  // 如果没有更新或者不在 Electron 环境中，不显示任何内容
  if (!updateAvailable && !open) return null;

  return (
    <>
      {updateAvailable && (
        <Button color="primary" startIcon={<UpdateIcon />} onClick={() => setOpen(true)} sx={{ ml: 1 }}>
          {t('update.newVersion')}
        </Button>
      )}

      <Snackbar
        open={open}
        autoHideDuration={null}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity="info" sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ p: 1 }}>
            <Typography variant="h6">{t('update.newVersionAvailable')}</Typography>

            {updateInfo && (
              <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('update.currentVersion')}: {updateInfo.currentVersion}
                </Typography>
                <Typography variant="body2">
                  {t('update.latestVersion')}: {updateInfo.version}
                </Typography>
              </>
            )}

            {checking && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2">{t('update.checking')}</Typography>
              </Box>
            )}

            {updateError && (
              <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                {updateError}
              </Typography>
            )}

            {downloading && (
              <Box sx={{ mt: 2, width: '100%' }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {t('update.downloading')}: {Math.round(downloadProgress)}%
                </Typography>
                <LinearProgress variant="determinate" value={downloadProgress} />
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              {/* {!downloading && !updateDownloaded ? (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={checking || downloading}
                  onClick={downloadUpdate}
                >
                  {t('update.downloadNow')}
                </Button>
              ) : updateDownloaded ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={installUpdate}
                >
                  {t('update.installNow')}
                </Button>
              ) : null} */}

              {updateInfo?.releaseUrl && (
                <Link href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outlined">{t('update.viewRelease')}</Button>
                </Link>
              )}
            </Box>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateChecker;
