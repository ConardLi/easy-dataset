'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  useTheme,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import ParticleBackground from '@/components/home/ParticleBackground';
import Navbar from '@/components/Navbar';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const searchParams = useSearchParams();
  const forceParam = searchParams.get('force');
  const forceChange = forceParam === '1' || forceParam === 'true';

  useEffect(() => {
    checkAuth(forceChange);
  }, [forceChange]);

  const checkAuth = async (shouldForce) => {
    try {
      const response = await axios.get('/api/users');
      if (response.data && response.data.id) {
        setUser(response.data);
        // 检查是否需要强制修改密码
        const userDetailResponse = await axios.get(`/api/users/${response.data.id}`);
        const forceFirstLogin = Boolean(userDetailResponse.data.needChangePassword && shouldForce);
        setIsFirstLogin(forceFirstLogin);
      } else {
        router.push('/login');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  const toggleVisibility = field => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    // 验证新密码
    if (!newPassword.trim()) {
      toast.error('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('密码长度至少为6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    // 如果不是首次登录，需要验证当前密码
    if (!isFirstLogin) {
      if (!currentPassword.trim()) {
        toast.error('请输入当前密码');
        return;
      }
    }

    setLoading(true);

    try {
      await axios.put(`/api/users/${user.id}/password`, {
        currentPassword: isFirstLogin ? undefined : currentPassword,
        newPassword: newPassword
      });

      toast.success('密码修改成功');
      
      // 如果是首次登录，修改密码后跳转到首页
      if (isFirstLogin) {
        router.push('/');
      } else {
        // 否则返回上一页或首页
        router.back();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || '修改密码失败，请重试';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.background.default,
        minHeight: '100vh'
      }}
    >
      <ParticleBackground />
      <Navbar projects={[]} />
      
      <Container maxWidth="sm" sx={{ py: 8, position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: '24px',
              background: isDark
                ? 'rgba(11, 17, 33, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.35)'
                : '1px solid rgba(148, 163, 184, 0.35)',
              boxShadow: isDark
                ? '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                : '0 18px 45px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.12)'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  background: theme.palette.gradient?.primary || 
                    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {isFirstLogin ? '首次登录，请设置密码' : '修改密码'}
              </Typography>
              {isFirstLogin && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: '12px' }}>
                  为了账户安全，请设置您的登录密码
                </Alert>
              )}
            </Box>

            <form onSubmit={handleChangePassword}>
              {!isFirstLogin && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="当前密码"
                    type={passwordVisibility.current ? 'text' : 'password'}
                    variant="outlined"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={passwordVisibility.current ? '隐藏密码' : '显示密码'}
                            onClick={() => toggleVisibility('current')}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                          >
                            {passwordVisibility.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="新密码"
                  type={passwordVisibility.new ? 'text' : 'password'}
                  variant="outlined"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoFocus={isFirstLogin}
                  helperText="密码长度至少为6位"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={passwordVisibility.new ? '隐藏密码' : '显示密码'}
                          onClick={() => toggleVisibility('new')}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {passwordVisibility.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="确认新密码"
                  type={passwordVisibility.confirm ? 'text' : 'password'}
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleChangePassword(e);
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={passwordVisibility.confirm ? '隐藏密码' : '显示密码'}
                          onClick={() => toggleVisibility('confirm')}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {passwordVisibility.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  background: theme.palette.gradient?.primary || 
                    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)',
                  '&:hover': {
                    background: theme.palette.gradient?.primary || 
                      'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #0891B2 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? '修改中...' : '确认修改'}
              </Button>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </main>
  );
}
