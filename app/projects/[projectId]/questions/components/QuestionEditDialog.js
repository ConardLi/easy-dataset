'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  TextField as MuiTextField
} from '@mui/material';

export default function QuestionEditDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  chunks,
  tags,
  mode = 'create' // 'create' or 'edit'
}) {
  const { t } = useTranslation();

  // 获取文本块的标题
  const getChunkTitle = chunkId => {
    const chunk = chunks.find(c => c.id === chunkId);
    return chunk?.filename || chunkId; // 直接使用文件名
  };

  const [formData, setFormData] = useState({
    question: '',
    chunkId: '',
    label: '' // 默认不选中任何标签
  });

  useEffect(() => {
    if (initialData) {
      console.log('初始数据:', initialData); // 查看传入的初始数据
      setFormData({
        question: initialData.question || '',
        chunkId: initialData.chunkId || '',
        label: initialData.label || 'other' // 改用 label 而不是 label
      });
    } else {
      setFormData({
        question: '',
        chunkId: '',
        label: ''
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const flattenTags = (tags, prefix = '') => {
    let flatTags = [];
    const traverse = node => {
      flatTags.push({
        id: node.label, // 使用标签名作为 id
        label: node.label, // 直接使用原始标签名
        originalLabel: node.label
      });
      if (node.child && node.child.length > 0) {
        node.child.forEach(child => traverse(child));
      }
    };
    tags.forEach(tag => traverse(tag));
    flatTags.push({
      id: 'other',
      label: t('datasets.uncategorized'),
      originalLabel: 'other'
    });
    return flatTags;
  };

  const flattenedTags = useMemo(() => flattenTags(tags), [tags, t]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        question: initialData.question || '',
        chunkId: initialData.chunkId || '',
        label: initialData.label || 'other'
      });
    } else {
      setFormData({
        question: '',
        chunkId: '',
        label: '' // 新建时默认为空
      });
    }
  }, [initialData]);

  // 修改 return 中的 Autocomplete 组件
  <Autocomplete
    fullWidth
    options={flattenedTags}
    getOptionLabel={tag => {
      return tag.label;
    }}
    value={(() => {
      const foundTag = flattenedTags.find(tag => tag.id === formData.label);
      const defaultTag = flattenedTags.find(tag => tag.id === 'other');
      return foundTag || defaultTag;
    })()}
    onChange={(e, newValue) => {
      setFormData({ ...formData, label: newValue ? newValue.id : 'other' });
    }}
    renderInput={params => (
      <MuiTextField {...params} label={t('questions.selectTag')} placeholder={t('questions.searchTag')} />
    )}
  />;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? t('questions.createQuestion') : t('questions.editQuestion')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label={t('questions.questionContent')}
            multiline
            rows={4}
            fullWidth
            value={formData.question}
            onChange={e => setFormData({ ...formData, question: e.target.value })}
          />

          <Autocomplete
            fullWidth
            options={chunks}
            getOptionLabel={chunk => getChunkTitle(chunk.id)}
            value={chunks.find(chunk => chunk.id === formData.chunkId) || null}
            onChange={(e, newValue) => setFormData({ ...formData, chunkId: newValue ? newValue.id : '' })}
            renderInput={params => (
              <MuiTextField {...params} label={t('questions.selectChunk')} placeholder={t('questions.searchChunk')} />
            )}
          />

          <Autocomplete
            fullWidth
            options={flattenedTags}
            getOptionLabel={tag => tag.label}
            value={flattenedTags.find(tag => tag.id === formData.label) || null}
            onChange={(e, newValue) => setFormData({ ...formData, label: newValue ? newValue.id : '' })}
            renderInput={params => (
              <MuiTextField {...params} label={t('questions.selectTag')} placeholder={t('questions.searchTag')} />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.question || !formData.chunkId}>
          {mode === 'create' ? t('common.create') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
