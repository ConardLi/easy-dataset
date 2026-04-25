'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import 'github-markdown-css/github-markdown-light.css';

function getValue(value, answerType, useMarkdown, t, onOptimize) {
  if (value) {
    if (answerType === 'custom_format' && onOptimize) {
      try {
        const data = JSON.parse(value);
        value = JSON.stringify(data, null, 2);
        return (
          <Box
            sx={{
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            <Typography component="pre" variant="body2" sx={{ m: 0 }}>
              {JSON.stringify(data, null, 2)}
            </Typography>
          </Box>
        );
      } catch {}
    }
    if (answerType === 'label' && onOptimize) {
      try {
        const labels = JSON.parse(value);
        if (Array.isArray(labels)) {
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {labels.map((label, idx) => (
                <Chip
                  key={idx}
                  label={String(label)}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ height: 22, '& .MuiChip-label': { px: 1 } }}
                />
              ))}
            </Box>
          );
        }
      } catch {
        return <Typography variant="body1">{value}</Typography>;
      }
    }
    return useMarkdown ? (
      <div className="markdown-body">
        <ReactMarkdown>{value}</ReactMarkdown>
      </div>
    ) : (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    );
  } else {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('common.noData')}
      </Typography>
    );
  }
}

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
  onOptimize,
  tokenCount,
  optimizing = false,
  dataset
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { answerType } = dataset;
  const custom = answerType === 'custom_format' || answerType === 'label';

  // 从 localStorage 读取 Markdown 展示设置，默认为 false
  const [useMarkdown, setUseMarkdown] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dataset-use-markdown');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // 当 useMarkdown 状态改变时，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dataset-use-markdown', JSON.stringify(useMarkdown));
    }
  }, [useMarkdown]);

  const toggleMarkdown = () => {
    setUseMarkdown(!useMarkdown);
  };

  const getAnswerTypeLabel = type => {
    switch (type) {
      case 'label':
        return t('imageDatasets.typeLabel', '标签');
      case 'custom_format':
        return t('imageDatasets.typeCustom', '自定义');
      default:
        return t('imageDatasets.typeText', '文本');
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1 }}>
          {label}
        </Typography>
        {!editing && value && (
          <>
            {onOptimize && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '12px',
                  bgcolor: 'info.50',
                  color: 'info.main',
                  px: 1,
                  py: 0.25,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: 'info.100',
                  mr: 1
                }}
              >
                {getAnswerTypeLabel(answerType)}
              </Box>
            )}
            {/* 字符数标签 */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '12px',
                bgcolor: 'info.50',
                color: 'info.main',
                px: 1,
                py: 0.25,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid',
                borderColor: 'info.100',
                mr: 1
              }}
            >
              {value.length} Characters
            </Box>

            {/* Token 标签 */}
            {tokenCount > 0 && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '12px',
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  px: 1,
                  py: 0.25,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: 'primary.100',
                  mr: 1
                }}
              >
                {tokenCount} Tokens
              </Box>
            )}
          </>
        )}
        {!editing && (
          <>
            <IconButton size="small" onClick={onEdit} disabled={optimizing}>
              <EditIcon fontSize="small" />
            </IconButton>
            {onOptimize && !custom && (
              <IconButton
                size="small"
                onClick={onOptimize}
                disabled={optimizing}
                sx={{ ml: 0.5, position: 'relative' }}
                title={`optimizing=${optimizing}`}
              >
                {optimizing ? <CircularProgress size={20} /> : <AutoFixHighIcon fontSize="small" />}
              </IconButton>
            )}
            {!custom && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={useMarkdown}
                    onChange={toggleMarkdown}
                    sx={{ ml: 1 }}
                    disabled={optimizing}
                  />
                }
                label={<Typography variant="caption">{useMarkdown ? 'Markdown' : 'Text'}</Typography>}
                sx={{ ml: 1 }}
              />
            )}
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
            p: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            '& img': {
              maxWidth: '100%'
            }
          }}
        >
          {getValue(value, answerType, useMarkdown, t, onOptimize)}
        </Box>
      )}
    </Box>
  );
}
