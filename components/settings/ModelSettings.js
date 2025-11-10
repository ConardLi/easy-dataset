'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Autocomplete,
  Slider,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  Tooltip,
  IconButton,
  Chip,
  useTheme,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { DEFAULT_MODEL_SETTINGS, MODEL_PROVIDERS } from '@/constant/model';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ProviderIcon } from '@lobehub/icons';
import { toast } from 'sonner';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { modelConfigListAtom, selectedModelInfoAtom } from '@/lib/store';

export default function ModelSettings({ projectId }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  // 展示端点的最大长度
  const MAX_ENDPOINT_DISPLAY = 80;
  // 模型对话框状态
  const [openModelDialog, setOpenModelDialog] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providerList, setProviderList] = useState([]);
  const [providerOptions, setProviderOptions] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState({});
  const [models, setModels] = useState([]);
  const [modelConfigList, setModelConfigList] = useAtom(modelConfigListAtom);
  const [selectedModelInfo, setSelectedModelInfo] = useAtom(selectedModelInfoAtom);
  const [modelConfigForm, setModelConfigForm] = useState({
    id: '',
    providerId: '',
    providerName: '',
    endpoint: '',
    apiKey: '',
    modelId: '',
    modelName: '',
    type: 'text',
    temperature: 0.0,
    maxTokens: 0,
    topP: 0,
    topK: 0,
    status: 1
  });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    getProvidersList();
    getModelConfigList();
  }, []);

  // 获取提供商列表
  const getProvidersList = () => {
    axios.get('/api/llm/providers').then(response => {
      console.log('获取的模型列表:', response.data);
      setProviderList(response.data);
      const providerOptions = response.data.map(provider => ({
        id: provider.id,
        label: provider.name
      }));
      setSelectedProvider(response.data[0]);
      getProviderModels(response.data[0].id);
      setProviderOptions(providerOptions);
    });
  };

  // 裁剪端点展示长度（不改变实际值，仅用于 UI 展示）
  const formatEndpoint = model => {
    if (!model?.endpoint) return '';
    const base = model.endpoint.replace(/^https?:\/\//, '');
    if (base.length > MAX_ENDPOINT_DISPLAY) {
      return base.slice(0, MAX_ENDPOINT_DISPLAY) + '…';
    }
    return base;
  };

  // 获取模型配置列表
  const getModelConfigList = () => {
    axios
      .get(`/api/projects/${projectId}/model-config`)
      .then(response => {
        setModelConfigList(response.data.data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        toast.error('Fetch model list Error', { duration: 3000 });
      });
  };

  const onChangeProvider = (event, newValue) => {
    console.log('选择提供商:', newValue, typeof newValue);
    if (typeof newValue === 'string') {
      // 用户手动输入了自定义提供商
      setModelConfigForm(prev => ({
        ...prev,
        providerId: 'custom',
        endpoint: '',
        providerName: ''
      }));
    } else if (newValue && newValue.id) {
      // 用户从下拉列表中选择了一个提供商
      const selectedProvider = providerList.find(p => p.id === newValue.id);
      if (selectedProvider) {
        setSelectedProvider(selectedProvider);
        setModelConfigForm(prev => ({
          ...prev,
          providerId: selectedProvider.id,
          endpoint: selectedProvider.apiUrl,
          providerName: selectedProvider.name,
          modelName: ''
        }));
        getProviderModels(newValue.id);
      }
    }
  };

  // 获取提供商的模型列表（DB）
  const getProviderModels = providerId => {
    axios
      .get(`/api/llm/model?providerId=${providerId}`)
      .then(response => {
        setModels(response.data);
      })
      .catch(error => {
        toast.error('Get Models Error', { duration: 3000 });
      });
  };

  //同步模型列表
  const refreshProviderModels = async () => {
    let data = await getNewModels();
    if (!data) return;
    if (data.length > 0) {
      setModels(data);
      toast.success('Refresh Success', { duration: 3000 });
      const newModelsData = await axios.post('/api/llm/model', {
        newModels: data,
        providerId: selectedProvider.id
      });
      if (newModelsData.status === 200) {
        toast.success('Get Model Success', { duration: 3000 });
      }
    } else {
      toast.info('No Models Need Refresh', { duration: 3000 });
    }
  };

  //获取最新模型列表
  async function getNewModels() {
    try {
      if (!modelConfigForm || !modelConfigForm.endpoint) {
        return null;
      }
      const providerId = modelConfigForm.providerId;
      console.log(providerId, 'getNewModels providerId');

      // 使用后端 API 代理请求
      const res = await axios.post('/api/llm/fetch-models', {
        endpoint: modelConfigForm.endpoint,
        providerId: providerId,
        apiKey: modelConfigForm.apiKey
      });

      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error('API Key Invalid', { duration: 3000 });
      } else {
        toast.error('Get Model List Error', { duration: 3000 });
      }
      return null;
    }
  }

  // 打开模型对话框
  const handleOpenModelDialog = (model = null) => {
    if (model) {
      console.log('handleOpenModelDialog', model);
      // 编辑现有模型时，为未设置的参数应用默认值
      setModelConfigForm({
        ...model,
        temperature: model.temperature !== undefined ? model.temperature : DEFAULT_MODEL_SETTINGS.temperature,
        maxTokens: model.maxTokens !== undefined ? model.maxTokens : DEFAULT_MODEL_SETTINGS.maxTokens,
        topP: model.topP !== undefined && model.topP !== 0 ? model.topP : DEFAULT_MODEL_SETTINGS.topP
      });
      getProviderModels(model.providerId);
    } else {
      setModelConfigForm({
        ...modelConfigForm,
        apiKey: '',
        ...DEFAULT_MODEL_SETTINGS,
        id: ''
      });
    }
    setShowApiKey(false);
    setOpenModelDialog(true);
  };

  // 关闭模型对话框
  const handleCloseModelDialog = () => {
    setOpenModelDialog(false);
  };

  // 处理模型表单变更
  const handleModelFormChange = e => {
    const { name, value } = e.target;
    console.log('handleModelFormChange', name, value);
    setModelConfigForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存模型
  const handleSaveModel = () => {
    axios
      .post(`/api/projects/${projectId}/model-config`, { ...modelConfigForm, modelId: modelConfigForm.modelName })
      .then(response => {
        if (selectedModelInfo && selectedModelInfo.id === response.data.id) {
          setSelectedModelInfo(response.data);
        }
        toast.success(t('settings.saveSuccess'), { duration: 3000 });
        getModelConfigList();
        handleCloseModelDialog();
      })
      .catch(error => {
        toast.error(t('settings.saveFailed'));
        console.error(error);
      });
  };

  // 删除模型
  const handleDeleteModel = id => {
    axios
      .delete(`/api/projects/${projectId}/model-config/${id}`)
      .then(response => {
        toast.success(t('settings.deleteSuccess'), { duration: 3000 });
        getModelConfigList();
      })
      .catch(error => {
        toast.error(t('settings.deleteFailed'), { duration: 3000 });
      });
  };

  // 获取模型状态图标和颜色
  const getModelStatusInfo = model => {
    if (model.providerId.toLowerCase() === 'ollama') {
      return {
        icon: <CheckCircleIcon fontSize="small" />,
        color: 'success',
        text: t('models.localModel')
      };
    } else if (model.apiKey) {
      return {
        icon: <CheckCircleIcon fontSize="small" />,
        color: 'success',
        text: t('models.apiKeyConfigured')
      };
    } else {
      return {
        icon: <ErrorIcon fontSize="small" />,
        color: 'warning',
        text: t('models.apiKeyNotConfigured')
      };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography color={isDark ? '#F8FAFC' : '#0F172A'}>{t('textSplit.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          fontWeight={700}
          sx={{
            color: isDark ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.02em',
            fontSize: '1.5rem',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-8px',
              left: 0,
              width: '60px',
              height: '3px',
              background: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
              borderRadius: '2px',
              opacity: 0.6
            }
          }}
        >
          {t('settings.modelConfig')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ScienceIcon />}
            onClick={() => router.push(`/projects/${projectId}/playground`)}
            size="medium"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              px: 3,
              py: 1.25,
              borderWidth: '2px',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)',
              color: isDark ? '#E0E7FF' : '#6366F1',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
              fontSize: '0.9375rem',
              letterSpacing: '0.01em',
              '&:hover': {
                borderWidth: '2px',
                borderColor: theme.palette.primary.main,
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                color: isDark ? '#FFFFFF' : theme.palette.primary.main,
                transform: 'translateY(-2px)',
                boxShadow: isDark
                  ? '0 6px 16px rgba(99, 102, 241, 0.35)'
                  : '0 6px 16px rgba(99, 102, 241, 0.25)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {t('playground.title')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModelDialog()}
            size="medium"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              px: 3,
              py: 1,
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
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {t('models.add')}
          </Button>
        </Box>
      </Box>

        {(!modelConfigList || modelConfigList.length === 0) && (
          <Box
            sx={{
              border: `2px dashed ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
              borderRadius: '16px',
              p: 6,
              textAlign: 'center',
              background: isDark
                ? 'rgba(99, 102, 241, 0.05)'
                : 'rgba(99, 102, 241, 0.03)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              mb: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                opacity: 0.5
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1.5,
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontWeight: 600
              }}
            >
              {t('models.unselectedModel')}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 3,
                color: isDark ? '#CBD5E1' : '#64748B',
                fontSize: '0.9375rem'
              }}
            >
              {t('models.typeTips')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => handleOpenModelDialog()} 
              startIcon={<AddIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {t('models.add')}
            </Button>
          </Box>
        )}

        {!!modelConfigList?.length && (
          <Stack spacing={2}>
            {modelConfigList.map(model => (
              <Paper
                key={model.id}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
                  background: isDark
                    ? 'rgba(15, 23, 42, 0.6)'
                    : '#FFFFFF',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)',
                    boxShadow: isDark
                      ? '0 8px 32px rgba(99, 102, 241, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                      : '0 8px 32px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.2)',
                    transform: 'translateY(-4px)',
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`
                      }}
                    >
                      <ProviderIcon key={model.providerId} provider={model.providerId} size={36} type={'color'} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        fontWeight={700}
                        noWrap
                        sx={{
                          mb: 0.5,
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          fontSize: '1.125rem'
                        }}
                      >
                        {model.modelName ? model.modelName : t('models.unselectedModel')}
                      </Typography>
                      <Chip
                        label={model.providerName}
                        size="small"
                        sx={{
                          mt: 0.5,
                          maxWidth: 200,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: isDark
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(99, 102, 241, 0.08)',
                          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                          color: theme.palette.primary.main
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Tooltip title={getModelStatusInfo(model).text}>
                      <Chip
                        icon={getModelStatusInfo(model).icon}
                        label={`${formatEndpoint(model)}${
                          model.providerId.toLowerCase() !== 'ollama' && !model.apiKey
                            ? ' (' + t('models.unconfiguredAPIKey') + ')'
                            : ''
                        }`}
                        size="small"
                        sx={{
                          maxWidth: 360,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: getModelStatusInfo(model).color === 'success'
                            ? isDark
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(34, 197, 94, 0.08)'
                            : isDark
                            ? 'rgba(251, 146, 60, 0.15)'
                            : 'rgba(251, 146, 60, 0.08)',
                          border: `1px solid ${
                            getModelStatusInfo(model).color === 'success'
                              ? isDark
                                ? 'rgba(34, 197, 94, 0.3)'
                                : 'rgba(34, 197, 94, 0.2)'
                              : isDark
                              ? 'rgba(251, 146, 60, 0.3)'
                              : 'rgba(251, 146, 60, 0.2)'
                          }`,
                          color: getModelStatusInfo(model).color === 'success'
                            ? '#22C55E'
                            : '#FB923C'
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t('models.typeTips')}>
                      <Chip
                        label={t(`models.${model.type || 'text'}`)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: model.type === 'vision'
                            ? isDark
                              ? 'rgba(139, 92, 246, 0.15)'
                              : 'rgba(139, 92, 246, 0.08)'
                            : isDark
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(6, 182, 212, 0.08)',
                          border: `1px solid ${
                            model.type === 'vision'
                              ? isDark
                                ? 'rgba(139, 92, 246, 0.3)'
                                : 'rgba(139, 92, 246, 0.2)'
                              : isDark
                              ? 'rgba(6, 182, 212, 0.3)'
                              : 'rgba(6, 182, 212, 0.2)'
                          }`,
                          color: model.type === 'vision' ? '#8B5CF6' : '#06B6D4'
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t('playground.title')}>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/projects/${projectId}/playground?modelId=${model.id}`)}
                        sx={{
                          color: isDark ? '#E0E7FF' : theme.palette.secondary.main,
                          bgcolor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                          border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ScienceIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenModelDialog(model)}
                        sx={{
                          color: isDark ? '#E0E7FF' : theme.palette.primary.main,
                          bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`,
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteModel(model.id)}
                        disabled={modelConfigList.length <= 1}
                        sx={{
                          color: isDark ? '#FCA5A5' : '#EF4444',
                          bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                          border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                          '&:hover:not(:disabled)': {
                            bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                            transform: 'scale(1.1)'
                          },
                          '&:disabled': {
                            opacity: 0.4
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      {/* 模型表单对话框 */}
      <Dialog
        open={openModelDialog}
        onClose={handleCloseModelDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: isDark
              ? '#1E293B'
              : '#FFFFFF',
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
          {editingModel ? t('models.edit') : t('models.add')}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/*ai提供商*/}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Autocomplete
                  freeSolo
                  options={providerOptions}
                  getOptionLabel={option => option.label}
                  value={
                    providerOptions.find(p => p.id === modelConfigForm.providerId) || {
                      id: 'custom',
                      label: modelConfigForm.providerName || ''
                    }
                  }
                  onChange={onChangeProvider}
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
                    <TextField
                      {...params}
                      label={t('models.provider')}
                      onChange={e => {
                        // 当用户手动输入时，更新 provider 字段
                        setModelConfigForm(prev => ({
                          ...prev,
                          providerId: 'custom',
                          providerName: e.target.value
                        }));
                      }}
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
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    return (
                      <div {...props}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProviderIcon key={option.id} provider={option.id} size={32} type={'color'} />
                          {option.label}
                        </div>
                      </div>
                    );
                  }}
                />
              </FormControl>
            </Grid>
            {/*接口地址*/}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('models.endpoint')}
                name="endpoint"
                value={modelConfigForm.endpoint}
                onChange={handleModelFormChange}
                placeholder="例如: https://api.openai.com/v1"
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
                }}
              />
            </Grid>
            {/*api密钥*/}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('models.apiKey')}
                name="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={modelConfigForm.apiKey}
                onChange={handleModelFormChange}
                placeholder="例如: sk-..."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showApiKey ? '隐藏密钥' : '显示密钥'}
                        onClick={() => setShowApiKey(prev => !prev)}
                        onMouseDown={e => e.preventDefault()}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
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
                }}
              />
            </Grid>
            {/*模型列表*/}
            <Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
              <FormControl style={{ width: '70%' }}>
                <Autocomplete
                  freeSolo
                  options={models
                    .filter(model => model && model.modelName)
                    .map(model => ({
                      label: model.modelName,
                      id: model.id,
                      modelId: model.modelId,
                      providerId: model.providerId
                    }))}
                  value={modelConfigForm.modelName}
                  onChange={(event, newValue) => {
                    console.log('newValue', newValue);
                    setModelConfigForm(prev => ({
                      ...prev,
                      modelName: newValue?.label,
                      modelId: newValue?.modelId ? newValue?.modelId : newValue?.label
                    }));
                  }}
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
                    <TextField
                      {...params}
                      label={t('models.modelName')}
                      onChange={e => {
                        setModelConfigForm(prev => ({
                          ...prev,
                          modelName: e.target.value
                        }));
                      }}
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
                      }}
                    />
                  )}
                />
              </FormControl>
              <Button 
                variant="contained" 
                onClick={() => refreshProviderModels()} 
                sx={{ 
                  ml: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
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
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t('models.refresh')}
              </Button>
            </Grid>
            {/* 新增：视觉模型选择项 */}
            <Grid item xs={12}>
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
                  {t('models.type')}
                </InputLabel>
                <Select
                  label={t('models.type')}
                  value={modelConfigForm.type || 'text'}
                  onChange={handleModelFormChange}
                  name="type"
                  sx={{
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
                  }}
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
                  <MenuItem value="text">{t('models.text')}</MenuItem>
                  <MenuItem value="vision">{t('models.vision')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography 
                id="question-generation-length-slider" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  mb: 2
                }}
              >
                {t('models.temperature')}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  min={0}
                  max={2}
                  name="temperature"
                  value={modelConfigForm.temperature}
                  onChange={handleModelFormChange}
                  step={0.1}
                  valueLabelDisplay="auto"
                  aria-label="Temperature"
                  sx={{ 
                    flex: 1,
                    '& .MuiSlider-thumb': {
                      bgcolor: theme.palette.primary.main,
                      border: `3px solid ${isDark ? '#1E293B' : '#FFFFFF'}`,
                      width: 20,
                      height: 20,
                      boxShadow: `0 0 0 4px ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`
                    },
                    '& .MuiSlider-track': {
                      bgcolor: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                      border: 'none',
                      height: 6
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                      height: 6
                    },
                    '& .MuiSlider-valueLabel': {
                      bgcolor: theme.palette.primary.main,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      '&::before': {
                        display: 'none'
                      }
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    minWidth: '50px',
                    textAlign: 'center',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`
                  }}
                >
                  {modelConfigForm.temperature}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography 
                id="question-generation-length-slider" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  mb: 2
                }}
              >
                {t('models.maxTokens')}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  min={1024}
                  max={16384}
                  name="maxTokens"
                  value={modelConfigForm.maxTokens}
                  onChange={handleModelFormChange}
                  step={1}
                  valueLabelDisplay="auto"
                  aria-label="maxTokens"
                  sx={{ 
                    flex: 1,
                    '& .MuiSlider-thumb': {
                      bgcolor: theme.palette.primary.main,
                      border: `3px solid ${isDark ? '#1E293B' : '#FFFFFF'}`,
                      width: 20,
                      height: 20,
                      boxShadow: `0 0 0 4px ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`
                    },
                    '& .MuiSlider-track': {
                      bgcolor: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                      border: 'none',
                      height: 6
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                      height: 6
                    },
                    '& .MuiSlider-valueLabel': {
                      bgcolor: theme.palette.primary.main,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      '&::before': {
                        display: 'none'
                      }
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    minWidth: '70px',
                    textAlign: 'center',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`
                  }}
                >
                  {modelConfigForm.maxTokens}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography 
                id="top-p-slider" 
                gutterBottom
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  mb: 2
                }}
              >
                {t('models.topP', { defaultValue: 'Top P' })}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  min={0}
                  max={1}
                  name="topP"
                  value={modelConfigForm.topP}
                  onChange={handleModelFormChange}
                  step={0.1}
                  valueLabelDisplay="auto"
                  aria-label="topP"
                  sx={{ 
                    flex: 1,
                    '& .MuiSlider-thumb': {
                      bgcolor: theme.palette.primary.main,
                      border: `3px solid ${isDark ? '#1E293B' : '#FFFFFF'}`,
                      width: 20,
                      height: 20,
                      boxShadow: `0 0 0 4px ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`
                    },
                    '& .MuiSlider-track': {
                      bgcolor: theme.palette.gradient?.primary || 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                      border: 'none',
                      height: 6
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                      height: 6
                    },
                    '& .MuiSlider-valueLabel': {
                      bgcolor: theme.palette.primary.main,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      '&::before': {
                        display: 'none'
                      }
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    minWidth: '50px',
                    textAlign: 'center',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`
                  }}
                >
                  {modelConfigForm.topP}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 2 }}>
          <Button 
            onClick={handleCloseModelDialog}
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
            onClick={handleSaveModel}
            variant="contained"
            disabled={!modelConfigForm.providerId || !modelConfigForm.providerName || !modelConfigForm.endpoint}
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
    </Box>
  );
}
