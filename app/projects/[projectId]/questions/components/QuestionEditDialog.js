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
  TextField as MuiTextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Paper
} from '@mui/material';
import axios from 'axios';

export default function QuestionEditDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  projectId,
  tags,
  mode = 'create' // 'create' or 'edit'
}) {
  const [chunks, setChunks] = useState([]);
  const [images, setImages] = useState([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 获取文本块的标题
  const getChunkTitle = chunkId => {
    const chunk = chunks.find(c => c.id === chunkId);
    return chunk?.name || chunkId; // 直接使用文件名
  };

  const [formData, setFormData] = useState({
    id: '',
    question: '',
    sourceType: 'text', // 新增：数据源类型
    chunkId: '',
    imageId: '', // 新增：图片ID
    label: '' // 默认不选中任何标签
  });

  const getChunks = async projectId => {
    // 获取文本块列表
    const response = await axios.get(`/api/projects/${projectId}/split`);
    if (response.status !== 200) {
      throw new Error(t('common.fetchError'));
    }
    setChunks(response.data.chunks || []);
  };

  const getImages = async projectId => {
    // 获取图片列表（只获取ID和名称）
    try {
      const response = await axios.get(`/api/projects/${projectId}/images?page=1&pageSize=10000&simple=true`);
      if (response.status === 200) {
        setImages(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  useEffect(() => {
    getChunks(projectId);
    getImages(projectId);
    if (initialData) {
      // 根据 imageId 判断数据源类型
      console.log('initialData:', initialData);
      const sourceType = initialData.imageId ? 'image' : 'text';
      setFormData({
        id: initialData.id,
        question: initialData.question || '',
        sourceType: sourceType,
        chunkId: initialData.chunkId || '',
        imageId: initialData.imageId || '',
        label: initialData.label || 'other' // 改用 label 而不是 label
      });
    } else {
      setFormData({
        id: '',
        question: '',
        sourceType: 'text',
        chunkId: '',
        imageId: '',
        label: ''
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const flattenTags = (tags = [], prefix = '') => {
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

  const textFieldSx = {
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
    '& .MuiInputLabel-root': {
      color: isDark ? '#CBD5E1' : '#475569',
      fontWeight: 600,
      '&.Mui-focused': {
        color: theme.palette.primary.main
      }
    },
    '& .MuiInputBase-input': {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontWeight: 500
    }
  };

  const selectSx = {
    bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1.5px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.25)'}`,
    borderRadius: '12px',
    fontWeight: 600,
    '&:hover': {
      borderColor: theme.palette.primary.main
    },
    '&.Mui-focused': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
      boxShadow: `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'}`
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none'
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
        {mode === 'create' ? t('questions.createQuestion') : t('questions.editQuestion')}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 0 }}>
          {/* 数据源类型选择 */}
          <FormControl fullWidth>
            <InputLabel
              sx={{
                color: isDark ? '#CBD5E1' : '#475569',
                fontWeight: 600,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {t('questions.sourceType', { defaultValue: '数据源类型' })}
            </InputLabel>
            <Select
              value={formData.sourceType}
              label={t('questions.sourceType', { defaultValue: '数据源类型' })}
              onChange={e => {
                setFormData({
                  ...formData,
                  sourceType: e.target.value,
                  chunkId: '',
                  imageId: ''
                });
              }}
              sx={selectSx}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: '16px',
                    mt: 1,
                    bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                    boxShadow: isDark
                      ? '0 12px 48px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(15, 23, 42, 0.15)',
                    '& .MuiMenuItem-root': {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      fontWeight: 600,
                      borderRadius: '10px',
                      mx: 0.75,
                      my: 0.5,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
                      },
                      '&.Mui-selected': {
                        bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        '&:hover': {
                          bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                        }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="text">{t('questions.template.sourceType.text')}</MenuItem>
              <MenuItem value="image">{t('questions.template.sourceType.image')}</MenuItem>
            </Select>
          </FormControl>

          {/* 问题内容 */}
          <TextField
            label={t('questions.questionContent')}
            multiline
            rows={4}
            fullWidth
            value={formData.question}
            onChange={e => setFormData({ ...formData, question: e.target.value })}
            sx={textFieldSx}
          />

          {/* 文本块选择（仅当数据源为文本时显示） */}
          {formData.sourceType === 'text' && (
            <Autocomplete
              fullWidth
              options={chunks}
              getOptionLabel={chunk => getChunkTitle(chunk.id)}
              value={chunks.find(chunk => chunk.id === formData.chunkId) || null}
              onChange={(e, newValue) => setFormData({ ...formData, chunkId: newValue ? newValue.id : '' })}
              PaperComponent={({ children, ...other }) => (
                <Paper
                  {...other}
                  sx={{
                    borderRadius: '16px',
                    mt: 1,
                    bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                    boxShadow: isDark
                      ? '0 12px 48px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(15, 23, 42, 0.15)',
                    '& .MuiAutocomplete-option': {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      fontWeight: 600,
                      borderRadius: '10px',
                      mx: 0.75,
                      my: 0.5,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
                      },
                      '&[aria-selected="true"]': {
                        bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        '&:hover': {
                          bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                        }
                      }
                    }
                  }}
                >
                  {children}
                </Paper>
              )}
              renderInput={params => (
                <MuiTextField 
                  {...params} 
                  label={t('questions.selectChunk')} 
                  placeholder={t('questions.searchChunk')}
                  sx={textFieldSx}
                />
              )}
            />
          )}

          {/* 图片选择（仅当数据源为图片时显示） */}
          {formData.sourceType === 'image' && (
            <Autocomplete
              fullWidth
              options={images}
              getOptionLabel={image => image.imageName || ''}
              value={images.find(image => image.id === formData.imageId) || null}
              onChange={(e, newValue) => setFormData({ ...formData, imageId: newValue ? newValue.id : '' })}
              PaperComponent={({ children, ...other }) => (
                <Paper
                  {...other}
                  sx={{
                    borderRadius: '16px',
                    mt: 1,
                    bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                    boxShadow: isDark
                      ? '0 12px 48px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(15, 23, 42, 0.15)',
                    '& .MuiAutocomplete-option': {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      fontWeight: 600,
                      borderRadius: '10px',
                      mx: 0.75,
                      my: 0.5,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
                      },
                      '&[aria-selected="true"]': {
                        bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        '&:hover': {
                          bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                        }
                      }
                    }
                  }}
                >
                  {children}
                </Paper>
              )}
              renderInput={params => (
                <MuiTextField
                  {...params}
                  label={t('questions.selectImage', { defaultValue: '选择图片' })}
                  placeholder={t('questions.searchImage', { defaultValue: '搜索图片...' })}
                  sx={textFieldSx}
                />
              )}
            />
          )}

          {/* 标签选择 */}
          {formData.sourceType === 'text' && (
            <Autocomplete
              fullWidth
              options={flattenedTags}
              getOptionLabel={tag => tag.label}
              value={flattenedTags.find(tag => tag.id === formData.label) || null}
              onChange={(e, newValue) => setFormData({ ...formData, label: newValue ? newValue.id : '' })}
              PaperComponent={({ children, ...other }) => (
                <Paper
                  {...other}
                  sx={{
                    borderRadius: '16px',
                    mt: 1,
                    bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
                    boxShadow: isDark
                      ? '0 12px 48px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(15, 23, 42, 0.15)',
                    '& .MuiAutocomplete-option': {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      fontWeight: 600,
                      borderRadius: '10px',
                      mx: 0.75,
                      my: 0.5,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
                      },
                      '&[aria-selected="true"]': {
                        bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        '&:hover': {
                          bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                        }
                      }
                    }
                  }}
                >
                  {children}
                </Paper>
              )}
              renderInput={params => (
                <MuiTextField 
                  {...params} 
                  label={t('questions.selectTag')} 
                  placeholder={t('questions.searchTag')}
                  sx={textFieldSx}
                />
              )}
            />
          )}
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
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.question || (formData.sourceType === 'text' ? !formData.chunkId : !formData.imageId)}
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
          {mode === 'create' ? t('common.create') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
