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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { toast } from 'sonner';
import axios from 'axios';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
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
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
    handleClose();
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }

    setLoading(true);
    try {
      // 先尝试初始化用户体系（如果还没有）
      try {
        await axios.post('/api/users/init');
      } catch (error) {
        // 忽略初始化错误，可能已经初始化过了
      }

      // 尝试通过用户名登录（查找现有用户）
      let userId = null;
      try {
        const loginResponse = await axios.post('/api/users/login', {
          username: username.trim()
        });
        userId = loginResponse.data.user.id;
      } catch (error) {
        // 如果用户不存在，检查是否是管理员在创建新用户
        if (error.response?.status === 404) {
          // 检查当前用户是否为管理员
          try {
            const currentUserResponse = await axios.get('/api/users');
            if (currentUserResponse.data && currentUserResponse.data.role === 'admin') {
              // 管理员可以创建新用户
              try {
                const createResponse = await axios.post('/api/users', {
                  username: username.trim(),
                  role: 'user'
                });
                userId = createResponse.data.id;
                toast.success(`已创建新用户: ${username.trim()}`);
              } catch (createError) {
                throw new Error(createError.response?.data?.error || '创建用户失败');
              }
            } else {
              throw new Error('用户不存在，只有管理员可以创建新用户');
            }
          } catch (checkError) {
            throw new Error(checkError.message || '登录失败');
          }
        } else {
          throw error;
        }
      }

      // 设置当前用户
      if (userId) {
        await axios.post('/api/users/set-current', {
          userId: userId
        });
        
        // 获取用户信息
        const userResponse = await axios.get('/api/users');
        setUser(userResponse.data);
        setLoginDialogOpen(false);
        setUsername('');
        toast.success(`已登录为: ${userResponse.data.username}`);
        
        // 刷新页面以更新项目列表
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post('/api/users/logout');
      handleClose();
      toast.success('已退出登录');
      // 重定向到登录页面
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      toast.error('退出登录失败');
    }
  };

  const handleSwitchUser = () => {
    handleLoginClick();
  };

  return (
    <>
      <Tooltip title={user ? `当前用户: ${user.username}` : '登录/切换用户'}>
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
                    label="管理员"
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
            <MenuItem onClick={handleSwitchUser}>
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="切换用户" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="退出登录" />
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={handleLoginClick}>
            <ListItemIcon>
              <LoginIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="登录" />
          </MenuItem>
        )}
      </Menu>

      {/* 登录对话框 */}
      <Dialog
        open={loginDialogOpen}
        onClose={() => {
          setLoginDialogOpen(false);
          setUsername('');
        }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: isDark ? '#1E293B' : '#FFFFFF',
            backdropFilter: 'blur(24px)',
            border: isDark
              ? '1px solid rgba(99, 102, 241, 0.3)'
              : '1px solid rgba(99, 102, 241, 0.25)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {user ? '切换用户' : '登录'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="用户名"
            fullWidth
            variant="outlined"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            输入用户名登录。只有管理员可以创建新用户。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setLoginDialogOpen(false);
              setUsername('');
            }}
            sx={{ borderRadius: '10px' }}
          >
            取消
          </Button>
          <Button
            onClick={handleLogin}
            variant="contained"
            disabled={loading || !username.trim()}
            sx={{ borderRadius: '10px' }}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

