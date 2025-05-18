'use client';

import { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

/**
 * 可编辑字段组件，支持 Markdown 和原始文本两种展示方式
 */
export default function EditableField({
  label,
  value,
  multiline = true,
  editing,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onOptimize
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [useMarkdown, setUseMarkdown] = useState(false);

  const toggleMarkdown = () => {
    setUseMarkdown(!useMarkdown);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1 }}>
          {label}
        </Typography>
        {!editing && (
          <>
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            {onOptimize && (
              <IconButton size="small" onClick={onOptimize} sx={{ ml: 0.5 }}>
                <AutoFixHighIcon fontSize="small" />
              </IconButton>
            )}
            <FormControlLabel
              control={<Switch size="small" checked={useMarkdown} onChange={toggleMarkdown} sx={{ ml: 1 }} />}
              label={<Typography variant="caption">{useMarkdown ? 'Markdown' : 'Text'}</Typography>}
              sx={{ ml: 1 }}
            />
          </>
        )}
      </Box>
      {editing ? (
        <>
          <TextField
            fullWidth
            multiline={multiline}
            rows={10}
            value={value}
            onChange={onChange}
            variant="outlined"
            sx={{
              mb: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button variant="contained" onClick={onSave}>
              {t('common.save')}
            </Button>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            whiteSpace: 'pre-wrap',
            p: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            '& img': {
              maxWidth: '100%'
            },
            '& pre': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
              padding: '8px',
              borderRadius: '4px',
              overflowX: 'auto'
            },
            '& code': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
              padding: '2px 4px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }
          }}
        >
          {value ? (
            useMarkdown ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <Typography variant="body1">{value}</Typography>
            )
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('common.noData')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
