'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { FormControl, Select, MenuItem, useTheme, ListSubheader, Box, Fade } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai/index';
import { modelConfigListAtom, selectedModelInfoAtom } from '@/lib/store';
import axios from 'axios';

// 获取模型对应的图标路径
const getModelIcon = modelName => {
  if (!modelName) return '/imgs/models/default.svg';

  // 将模型名称转换为小写以便比较
  const lowerModelName = modelName.toLowerCase();

  // 定义已知模型前缀映射
  const modelPrefixes = [
    { prefix: 'doubao', icon: 'doubao.svg' },
    { prefix: 'qwen', icon: 'qwen.svg' },
    { prefix: 'gpt', icon: 'gpt.svg' },
    { prefix: 'gemini', icon: 'gemini.svg' },
    { prefix: 'claude', icon: 'claude.svg' },
    { prefix: 'llama', icon: 'llama.svg' },
    { prefix: 'mistral', icon: 'mistral.svg' },
    { prefix: 'yi', icon: 'yi.svg' },
    { prefix: 'deepseek', icon: 'deepseek.svg' },
    { prefix: 'chatglm', icon: 'chatglm.svg' },
    { prefix: 'wenxin', icon: 'wenxin.svg' },
    { prefix: 'glm', icon: 'glm.svg' },
    { prefix: 'hunyuan', icon: 'hunyuan.svg' }

    // 添加更多模型前缀映射...
  ];

  // 查找匹配的模型前缀
  const matchedPrefix = modelPrefixes.find(({ prefix }) => lowerModelName.includes(prefix));

  // 返回对应的图标路径，如果没有匹配则返回默认图标
  return `/imgs/models/${matchedPrefix ? matchedPrefix.icon : 'default.svg'}`;
};

export default function ModelSelect({
  size = 'small',
  minWidth = 50,
  projectId,
  minHeight = 36,
  required = false,
  onError
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const models = useAtomValue(modelConfigListAtom);
  const [selectedModelInfo, setSelectedModelInfo] = useAtom(selectedModelInfoAtom);
  // 确保始终使用字符串值初始化 selectedModel，避免从非受控变为受控
  const [selectedModel, setSelectedModel] = useState(() => {
    if (selectedModelInfo && selectedModelInfo.id) {
      return selectedModelInfo.id;
    } else if (models && models.length > 0 && models[0]?.id) {
      return models[0].id;
    }
    return '';
  });
  const [error, setError] = useState(false);
  const handleModelChange = event => {
    if (!event || !event.target) return;
    const newModelId = event.target.value;

    // 清除错误状态
    if (error) {
      setError(false);
      if (onError) onError(false);
    }

    // 找到选中的模型对象
    const selectedModelObj = models.find(model => model.id === newModelId);
    if (selectedModelObj) {
      setSelectedModel(newModelId);
      // 将完整的模型信息存储到 localStorage
      setSelectedModelInfo(selectedModelObj);
      updateDefaultModel(newModelId);
    } else {
      setSelectedModelInfo({
        id: newModelId
      });
    }
  };

  const updateDefaultModel = async id => {
    const res = await axios.put(`/api/projects/${projectId}`, { projectId, defaultModelConfigId: id });
    if (res.status === 200) {
      console.log('更新成功');
    }
  };

  // 检查是否选择了模型
  const validateModel = () => {
    if (required && (!selectedModel || selectedModel === '')) {
      setError(true);
      if (onError) onError(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (selectedModelInfo && selectedModelInfo.id) {
      setSelectedModel(selectedModelInfo.id);
    }
  }, [selectedModelInfo]);

  // 初始检查
  useEffect(() => {
    if (required) {
      validateModel();
    }
  }, [required]);

  // 获取当前选中模型的显示内容
  const renderSelectedValue = value => {
    const selectedModelObj = models.find(model => model.id === value);
    if (!selectedModelObj) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          component="img"
          src={getModelIcon(selectedModelObj.modelName)}
          alt={selectedModelObj.modelName}
          sx={{
            width: 20,
            height: 20,
            objectFit: 'contain',
            flexShrink: 0,
            background: '#ffffffc9',
            borderRadius: '50%',
            marginBottom: '-2px'
          }}
          onError={e => {
            e.target.src = '/imgs/models/default.svg';
          }}
        />
        {selectedModelObj.modelName}
      </Box>
    );
  };

  return (
    <FormControl size={size} sx={{ minWidth, minHeight }} error={error}>
      <Select
        value={selectedModel}
        onChange={handleModelChange}
        displayEmpty
        variant="outlined"
        onBlur={validateModel}
        renderValue={renderSelectedValue}
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : '#FFFFFF',
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#1E293B',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.875rem',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            padding: '6px 32px 6px 12px'
          },
          '& .MuiSelect-icon': {
            color: theme.palette.primary.main,
            right: '8px',
            transition: 'transform 0.3s ease'
          },
          '&.Mui-expanded .MuiSelect-icon': {
            transform: 'rotate(180deg)'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)',
            borderWidth: '1.5px'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px',
            boxShadow: `0 0 0 3px ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'}`
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : '#F8F9FA',
            transform: 'translateY(-1px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(99, 102, 241, 0.25)'
              : '0 4px 12px rgba(99, 102, 241, 0.2)'
          },
          marginRight: '-14px',
          minHeight: '36px'
        }}
        MenuProps={{
          PaperProps: {
            elevation: 0,
            sx: {
              mt: 1,
              borderRadius: '16px',
              background: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 12px 48px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
              overflow: 'hidden',
              maxHeight: '400px',
              '& .MuiListSubheader-root': {
                color: theme.palette.mode === 'dark' ? '#CBD5E1' : '#475569',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(99, 102, 241, 0.12)',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                py: 1
              },
              '& .MuiMenuItem-root': {
                minHeight: '48px',
                color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A',
                borderRadius: '10px',
                mx: 0.75,
                my: 0.5,
                px: 2,
                py: 1.25,
                fontSize: '0.9375rem',
                fontWeight: 600,
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                  color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.primary.main,
                  transform: 'translateX(4px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(99, 102, 241, 0.25)'
                    : '0 2px 8px rgba(99, 102, 241, 0.18)'
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                    : '0 4px 16px rgba(99, 102, 241, 0.35)',
                  '&:hover': {
                    opacity: 0.95,
                    transform: 'translateX(4px) scale(1.02)'
                  }
                }
              }
            }
          },
          TransitionComponent: Fade,
          transitionDuration: 200
        }}
      >
        <MenuItem value="" disabled>
          {error ? t('models.pleaseSelectModel') : t('playground.selectModelFirst')}
        </MenuItem>
        {(() => {
          // 按 provider 分组
          const filteredModels = models.filter(m => {
            if (m.providerId?.toLowerCase() === 'ollama') {
              return m.modelName && m.endpoint;
            } else {
              return m.modelName && m.endpoint && m.apiKey;
            }
          });

          // 获取所有 provider
          const providers = [...new Set(filteredModels.map(m => m.providerName || 'Other'))];

          return providers.map(provider => {
            const providerModels = filteredModels.filter(m => (m.providerName || 'Other') === provider);
            return [
              <ListSubheader
                key={`header-${provider}`}
                sx={{
                  pl: 2,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  mt: 1,
                  mb: 0.5
                }}
              >
                {provider || 'Other'}
              </ListSubheader>,
              ...providerModels.map(model => (
                <MenuItem
                  key={model.id}
                  value={model.id}
                  sx={{
                    pl: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    minHeight: '30px',
                    '&.Mui-selected': {
                      bgcolor: theme.palette.action.selected,
                      '&:hover': {
                        bgcolor: theme.palette.action.selected
                      }
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={getModelIcon(model.modelName)}
                    alt={model.modelName}
                    sx={{
                      width: 20,
                      height: 20,
                      objectFit: 'contain',
                      flexShrink: 0
                    }}
                    onError={e => {
                      e.target.src = '/imgs/models/default.svg';
                    }}
                  />
                  <Box 
                    component="span" 
                    sx={{ 
                      flex: 1, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {model.modelName}
                  </Box>
                </MenuItem>
              ))
            ];
          });
        })()}
      </Select>
    </FormControl>
  );
}
