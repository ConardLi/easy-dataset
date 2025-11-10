'use client';

import { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Box,
  Divider,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import { toast } from 'sonner';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';

  const open = Boolean(anchorEl);

  // 获取当前用户信息
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data && response.data.id) {
        setUser(response.data);
      } else {
        // 未登录，重定向到登录页
        window.location.href = '/login';
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // 未登录，重定向到登录页
        window.location.href = '/login';
      } else {
        console.error(t('userMenu.fetchUserFailed'), error);
      }
    }
  };

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLoginClick = () => {
    // 重定向到登录页面
    window.location.href = '/login';
  };

  const handleSwitchUser = async () => {
    // 切换用户时退出登录并跳转到登录页
    try {
      await axios.post('/api/users/logout');
      handleClose();
      toast.success(t('userMenu.logoutSuccess'));
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      toast.error(t('userMenu.logoutFailed'));
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post('/api/users/logout');
      handleClose();
      toast.success(t('userMenu.logoutSuccess'));
      // 重定向到登录页面
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      toast.error(t('userMenu.logoutFailed'));
    }
  };

  return (
    <>
      <Tooltip title={user ? t('userMenu.currentUser', { username: user.username }) : t('userMenu.loginOrSwitch')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
            color: isDark ? theme.palette.text.primary : '#1E293B',
            p: 1.25,
            borderRadius: '12px',
            border: isDark
              ? '1px solid rgba(99, 102, 241, 0.2)'
              : '1px solid rgba(99, 102, 241, 0.25)',
            width: '40px',
            height: '40px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F8F9FA',
              borderColor: theme.palette.primary.main,
              boxShadow: isDark
                ? '0 4px 16px rgba(99, 102, 241, 0.35), 0 0 0 3px rgba(99, 102, 241, 0.1)'
                : '0 4px 16px rgba(99, 102, 241, 0.25), 0 0 0 3px rgba(99, 102, 241, 0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          {user ? (
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <PersonIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            borderRadius: '16px',
            minWidth: 240,
            background: isDark ? '#1E293B' : '#FFFFFF',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: isDark
              ? '1px solid rgba(99, 102, 241, 0.3)'
              : '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: isDark
              ? '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
              : '0 12px 48px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
            overflow: 'hidden',
            '& .MuiMenuItem-root': {
              borderRadius: '10px',
              mx: 0.75,
              my: 0.5,
              minHeight: '48px',
              px: 2,
              py: 1.25,
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontSize: '0.9375rem',
              fontWeight: 600,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                color: isDark ? '#FFFFFF' : theme.palette.primary.main,
                transform: 'translateX(4px)'
              }
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {user ? (
          <>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '1rem',
                    fontWeight: 700
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.username}
                  </Typography>
                  {user.email && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? '#94A3B8' : '#64748B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {user.email}
                    </Typography>
                  )}
                </Box>
                {user.role === 'admin' && (
                  <Chip
                    label={t('userMenu.admin')}
                    size="small"
                    icon={<AdminPanelSettingsIcon sx={{ fontSize: '0.875rem !important' }} />}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 24
                    }}
                  />
                )}
              </Box>
            </Box>
            <Divider sx={{ mx: 1, my: 0.5 }} />
            <MenuItem
              onClick={() => {
                handleClose();
                window.location.href = '/change-password';
              }}
            >
              <ListItemIcon>
                <LockIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('userMenu.changePassword')} />
            </MenuItem>
            <MenuItem onClick={handleSwitchUser}>
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('userMenu.switchUser')} />
            </MenuItem>
            {user.role === 'admin' && (
              <>
                <Divider sx={{ mx: 1, my: 0.5 }} />
                <MenuItem
                  onClick={() => {
                    handleClose();
                    window.location.href = '/users';
                  }}
                >
                  <ListItemIcon>
                    <AdminPanelSettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t('userMenu.userManagement')} />
                </MenuItem>
              </>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('userMenu.logout')} />
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={handleLoginClick}>
            <ListItemIcon>
              <LoginIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('userMenu.login')} />
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

