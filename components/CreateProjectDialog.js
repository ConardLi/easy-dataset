'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Box,
  Typography,
  useTheme,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function CreateProjectDialog({ open, onClose }) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('创建项目失败');
      }

      const data = await response.json();
      router.push(`/projects/${data.id}/settings`);
    } catch (err) {
      console.error('创建项目出错:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 30, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">创建新项目</Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              autoFocus
              name="name"
              label="项目名称"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              name="description"
              label="项目描述"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
          </Box>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name}
            sx={{
              background: theme.palette.gradient.primary,
              '&:hover': {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : '创建项目'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
