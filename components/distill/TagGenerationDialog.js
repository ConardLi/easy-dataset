'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import i18n from '@/lib/i18n';

/**
 * 标签生成对话框组件
 * @param {Object} props
 * @param {boolean} props.open - 对话框是否打开
 * @param {Function} props.onClose - 关闭对话框的回调函数
 * @param {Function} props.onGenerated - 标签生成完成的回调函数
 * @param {string} props.projectId - 项目ID
 * @param {Object} props.parentTag - 父标签对象，为null时表示生成根标签
 * @param {string} props.tagPath - 标签链路
 * @param {Object} props.model - 选择的模型配置
 */
export default function TagGenerationDialog({ open, onClose, onGenerated, projectId, parentTag, tagPath, model }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(5);
  const [generatedTags, setGeneratedTags] = useState([]);
  const [parentTagName, setParentTagName] = useState('');
  const [project, setProject] = useState(null);

  // 获取项目信息，如果是顶级标签，默认填写项目名称
  useEffect(() => {
    if (projectId && !parentTag) {
      axios
        .get(`/api/projects/${projectId}`)
        .then(response => {
          setProject(response.data);
          setParentTagName(response.data.name || '');
        })
        .catch(error => {
          console.error('获取项目信息失败:', error);
        });
    } else if (parentTag) {
      setParentTagName(parentTag.label || '');
    }
  }, [projectId, parentTag]);

  // 处理生成标签
  const handleGenerateTags = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`/api/projects/${projectId}/distill/tags`, {
        parentTag: parentTagName,
        parentTagId: parentTag ? parentTag.id : null,
        tagPath: tagPath || parentTagName,
        count,
        model,
        language: i18n.language
      });

      setGeneratedTags(response.data);
    } catch (error) {
      console.error('生成标签失败:', error);
      setError(error.response?.data?.error || t('distill.generateTagsError'));
    } finally {
      setLoading(false);
    }
  };

  // 处理生成完成
  const handleGenerateComplete = async () => {
    if (onGenerated) {
      onGenerated(generatedTags);
    }
    handleClose();
  };

  // 处理关闭对话框
  const handleClose = () => {
    setGeneratedTags([]);
    setError('');
    setCount(5);
    if (onClose) {
      onClose();
    }
  };

  // 处理数量变化
  const handleCountChange = event => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setCount(value);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {parentTag
            ? t('distill.generateSubTagsTitle', { parentTag: parentTag.label })
            : t('distill.generateRootTagsTitle')}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 标签路径显示 */}
        {parentTag && tagPath && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('distill.tagPath')}:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, backgroundColor: 'background.paper' }}>
              <Typography variant="body1">{tagPath || parentTag.label}</Typography>
            </Paper>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('distill.parentTag')}:
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            value={parentTagName}
            onChange={e => setParentTagName(e.target.value)}
            placeholder={t('distill.parentTagPlaceholder')}
            disabled={loading || !parentTag}
            // 如果是顶级标签，设置为只读
            InputProps={{
              readOnly: !parentTag
            }}
            // 显示适当的帮助文本
            helperText={
              !parentTag
                ? t('distill.rootTopicHelperText', { defaultValue: '使用项目名称作为顶级主题' })
                : t('distill.parentTagHelp')
            }
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('distill.tagCount')}:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            type="number"
            value={count}
            onChange={handleCountChange}
            inputProps={{ min: 1, max: 100 }}
            disabled={loading}
            helperText={t('distill.tagCountHelp')}
          />
        </Box>

        {generatedTags.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {t('distill.generatedTags')}:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, backgroundColor: 'background.paper' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {generatedTags.map((tag, index) => (
                  <Chip key={index} label={tag.label} color="primary" variant="outlined" />
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel')}
        </Button>
        {generatedTags.length > 0 ? (
          <Button onClick={handleGenerateComplete} color="primary" variant="contained">
            {t('common.complete')}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateTags}
            disabled={loading || !parentTagName}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? t('common.generating') : t('distill.generateTags')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
