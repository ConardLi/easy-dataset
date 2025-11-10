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
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import ParticleBackground from '@/components/home/ParticleBackground';

export default function LoginPage() {
  const [username, setUsername] = useState('');
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
          // 检查当前用户是否为管理员（可能通过cookie）
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
              <Box sx={{ mb: 3 }}>
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
              <Typography variant="caption" color="text.secondary">
                输入用户名登录。只有管理员可以创建新用户。
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </main>
  );
}

