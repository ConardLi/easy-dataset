import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';

/**
 * 提示词编辑对话框组件
 */
const PromptEditDialog = ({
  open,
  title,
  promptType,
  promptKey,
  content,
  loading,
  onClose,
  onSave,
  onRestore,
  onContentChange
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: isDark ? '#1E293B' : '#FFFFFF',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: isDark
            ? '1px solid rgba(99, 102, 241, 0.35)'
            : '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: isDark
            ? '0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.15)'
            : '0 12px 48px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(99, 102, 241, 0.12)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            opacity: 0.6
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2.5,
          pt: 3,
          px: 3,
          borderBottom: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`,
          color: isDark ? '#F8FAFC' : '#0F172A',
          fontWeight: 700,
          fontSize: '1.5rem',
          letterSpacing: '-0.02em',
          background: isDark
            ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(99, 102, 241, 0.03) 0%, transparent 100%)'
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="body2" 
            sx={{
              color: isDark ? '#CBD5E1' : '#64748B',
              fontWeight: 600,
              mb: 0.5
            }}
          >
            {t('settings.prompts.promptType')}: {promptType}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{
              color: isDark ? '#CBD5E1' : '#64748B',
              fontWeight: 600
            }}
          >
            {t('settings.prompts.keyName')}: {promptKey}
          </Typography>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={15}
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder={t('settings.prompts.contentPlaceholder')}
          variant="outlined"
          sx={{
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
              }
            },
            '& .MuiInputBase-input': {
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontWeight: 500,
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }
          }}
        />

        <Box display="flex" gap={1} sx={{ mt: 2 }}>
          <Button 
            startIcon={<RestoreIcon />} 
            onClick={onRestore} 
            size="small" 
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              color: isDark ? '#CBD5E1' : '#475569',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
              border: `1.5px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
              '&:hover': {
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                borderColor: theme.palette.primary.main,
                color: isDark ? '#FFFFFF' : theme.palette.primary.main
              }
            }}
          >
            {t('settings.prompts.restoreDefaultContent')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 2 }}>
        <Button 
          onClick={onClose}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            color: isDark ? '#CBD5E1' : '#475569',
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
            border: `1.5px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
            '&:hover': {
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)',
              borderColor: theme.palette.primary.main,
              color: isDark ? '#FFFFFF' : theme.palette.primary.main
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading} 
          startIcon={<SaveIcon />}
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
            '&:disabled': {
              background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
              color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.26)',
              boxShadow: 'none'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptEditDialog;
