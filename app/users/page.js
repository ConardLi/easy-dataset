'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  Alert,
  useTheme,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import axios from 'axios';
import ParticleBackground from '@/components/home/ParticleBackground';
import { useTranslation } from 'react-i18next';

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const languageCode = (i18n.language || 'en').toLowerCase();
  const dateLocale = languageCode.startsWith('zh') ? 'zh-CN' : 'en-US';

  const checkAuthAndLoadUsers = async () => {
    try {
      const userResponse = await axios.get('/api/users');
      if (!userResponse.data || userResponse.data.role !== 'admin') {
        toast.error(t('userManagement.onlyAdmin'));
        router.push('/');
        return;
      }
      setCurrentUser(userResponse.data);
      await loadUsers();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/login');
      } else {
        toast.error(t('userManagement.fetchUserFailed'));
        router.push('/login');
      }
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/list');
      setUsers(response.data);
    } catch (error) {
      toast.error(t('userManagement.fetchListFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleDelete = (user) => {
    setEditingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setShowPassword(false);
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error(t('userManagement.usernameRequired'));
      return;
    }

    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, {
          username: formData.username,
          email: formData.email || null,
          password: formData.password || undefined,
          role: formData.role
        });
        toast.success(t('userManagement.updateSuccess'));
      } else {
        await axios.post('/api/users', {
          username: formData.username,
          email: formData.email || null,
          password: formData.password || undefined,
          role: formData.role
        });
        toast.success(t('userManagement.createSuccess'));
      }
      handleCloseDialog();
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || t('userManagement.generalError'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingUser) return;

    if (editingUser.username === 'admin') {
      toast.error(t('userManagement.deleteAdminForbidden'));
      setDeleteDialogOpen(false);
      return;
    }

    if (editingUser.id === currentUser?.id) {
      toast.error(t('userManagement.deleteSelfForbidden'));
      setDeleteDialogOpen(false);
      return;
    }

    try {
      await axios.delete(`/api/users/${editingUser.id}`);
      toast.success(t('userManagement.deleteSuccess'));
      setDeleteDialogOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || t('userManagement.deleteFailed'));
    }
  };

  useEffect(() => {
    checkAuthAndLoadUsers();
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: theme.palette.background.default }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Typography>{t('userManagement.loading')}</Typography>
        </Box>
      </main>
    );
  }

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

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '24px',
            background: isDark ? 'rgba(11, 17, 33, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(24px)',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(148, 163, 184, 0.35)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              {t('userManagement.title')}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: '12px' }}>
              {t('userManagement.addUser')}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('userManagement.username')}</TableCell>
                  <TableCell>{t('userManagement.email')}</TableCell>
                  <TableCell>{t('userManagement.role')}</TableCell>
                  <TableCell>{t('userManagement.createdAt')}</TableCell>
                  <TableCell align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role === 'admin' ? t('userManagement.roleAdmin') : t('userManagement.roleUser')}
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(user.createAt).toLocaleDateString(dateLocale)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(user)} sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {user.username !== 'admin' && user.id !== currentUser?.id && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(user)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: isDark ? '#1E293B' : '#FFFFFF'
          }
        }}
      >
        <DialogTitle>
          {editingUser ? t('userManagement.editDialogTitle') : t('userManagement.createDialogTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('userManagement.username')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={editingUser?.username === 'admin'}
              fullWidth
            />
            <TextField
              label={t('userManagement.emailLabel')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label={editingUser ? t('userManagement.newPasswordLabel') : t('userManagement.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t(
                        showPassword ? 'userManagement.hidePassword' : 'userManagement.showPassword'
                      )}
                      onClick={() => setShowPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              fullWidth
            />
            <TextField
              label={t('userManagement.roleLabel')}
              select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              SelectProps={{
                native: true
              }}
              fullWidth
            >
              <option value="user">{t('userManagement.roleUser')}</option>
              <option value="admin">{t('userManagement.roleAdmin')}</option>
            </TextField>
            {editingUser?.username === 'admin' && (
              <Alert severity="info">{t('userManagement.adminProtected')}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: isDark ? '#1E293B' : '#FFFFFF'
          }
        }}
      >
        <DialogTitle>{t('userManagement.deleteDialogTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('userManagement.deleteDialogContent', {
              username: editingUser?.username || ''
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
