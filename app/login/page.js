'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  useTheme,
  Alert,
  alpha,
  InputAdornment,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import ParticleBackground from '@/components/home/ParticleBackground';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 检查是否已登录
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data && response.data.id) {
        // 已登录，重定向到首页
        router.push('/');
      }
    } catch (error) {
      // 未登录，停留在登录页
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 尝试通过用户名和密码登录
      let userId = null;
      try {
        const loginResponse = await axios.post('/api/users/login', {
          username: username.trim(),
          password: password || undefined
        });
        userId = loginResponse.data.user.id;
      } catch (error) {
        // 如果用户不存在，检查是否是管理员在创建新用户
        if (error.response?.status === 404) {
          // 检查当前用户是否为管理员（可能通过cookie）
          try {
            const currentUserResponse = await axios.get('/api/users');
            if (currentUserResponse.data && currentUserResponse.data.role === 'admin') {
              // 管理员可以创建新用户
              try {
                const createResponse = await axios.post('/api/users', {
                  username: username.trim(),
                  password: password || undefined,
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
        
        // 检查是否需要修改密码
        try {
          const userDetailResponse = await axios.get(`/api/users/${userId}`);
          if (userDetailResponse.data.needChangePassword) {
            // 需要修改密码，跳转到修改密码页面
            router.push('/change-password?force=1');
            return;
          }
        } catch (error) {
          console.error('检查用户信息失败:', error);
        }
        
        toast.success('登录成功');
        // 重定向到首页
        router.push('/');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || '登录失败，请重试';
      setError(errorMessage);
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* 粒子背景 */}
      <ParticleBackground />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
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
                variant="h4"
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
                HKGAI Dataset Generation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                登录您的账户
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="用户名"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
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
                  label="密码"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin(e);
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? '隐藏密码' : '显示密码'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
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

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !username.trim()}
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
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                首次部署请手动初始化数据库：
                <Box
                  component="code"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem'
                  }}
                >
                  curl -X POST http://localhost:1717/api/users/init
                </Box>
                或运行 <Box component="span" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>node scripts/migrate-add-users.js</Box>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                如需帮助，请联系管理员：{' '}
                <Typography
                  component="a"
                  href="mailto:guozhenhua@hkgai.org"
                  variant="caption"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  guozhenhua@hkgai.org
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </main>
  );
}
