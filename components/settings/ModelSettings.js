'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
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
  Avatar,
  Tooltip,
  IconButton,
  Chip
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
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { modelConfigListAtom, selectedModelInfoAtom } from '@/lib/store';

export default function ModelSettings({ projectId }) {
  const { t } = useTranslation();
  const router = useRouter();
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
      let url = modelConfigForm.endpoint.replace(/\/$/, ''); // 去除末尾的斜杠
      const providerId = modelConfigForm.providerId;
      console.log(providerId, 'getNewModels providerId');
      url += providerId === 'ollama' ? '/tags' : '/models';
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${modelConfigForm.apiKey}`
        }
      });
      if (providerId === 'ollama') {
        return res.data.models.map(item => ({
          modelId: item.model,
          modelName: item.name,
          providerId
        }));
      } else {
        return res.data.data.map(item => ({
          modelId: item.id,
          modelName: item.id,
          providerId
        }));
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error('API Key invalid', { duration: 3000 });
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
      setModelConfigForm(model);
      getProviderModels(model.providerId);
    } else {
      setModelConfigForm({
        ...modelConfigForm,
        apiKey: '',
        ...DEFAULT_MODEL_SETTINGS,
        id: ''
      });
    }
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
      .post(`/api/projects/${projectId}/model-config`, modelConfigForm)
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
    return <Typography>{t('textSplit.loading')}</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold"></Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ScienceIcon />}
              onClick={() => router.push(`/projects/${projectId}/playground`)}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              {t('playground.title')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModelDialog()}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              {t('models.add')}
            </Button>
          </Box>
        </Box>

        <Stack spacing={2}>
          {modelConfigList.map(model => (
            <Paper
              key={model.id}
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ProviderIcon key={model.providerId} provider={model.providerId} size={32} type={'color'} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {model.modelName ? model.modelName : t('models.unselectedModel')}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary" // 改为主色调
                      sx={{
                        fontWeight: 'medium', // 加粗
                        bgcolor: 'primary.50', // 添加背景色
                        px: 1, // 水平内边距
                        py: 0.2, // 垂直内边距
                        borderRadius: 1, // 圆角
                        display: 'inline-block' // 行内块元素
                      }}
                    >
                      {model.providerName}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={getModelStatusInfo(model).text}>
                    <Chip
                      icon={getModelStatusInfo(model).icon}
                      label={
                        model.endpoint.replace(/^https?:\/\//, '') +
                        (model.providerId.toLowerCase() !== 'ollama' && !model.apiKey
                          ? ' (' + t('models.unconfiguredAPIKey') + ')'
                          : '')
                      }
                      size="small"
                      color={getModelStatusInfo(model).color}
                      variant="outlined"
                    />
                  </Tooltip>
                  <Tooltip title={t('models.typeTips')}>
                    <Chip
                      sx={{ marginLeft: '5px' }}
                      label={t(`models.${model.type || 'text'}`)}
                      size="small"
                      color={model.type === 'vision' ? 'secondary' : 'info'}
                      variant="outlined"
                    />
                  </Tooltip>
                  <Tooltip title={t('playground.title')}>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/projects/${projectId}/playground?modelId=${model.id}`)}
                      color="secondary"
                    >
                      <ScienceIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('common.edit')}>
                    <IconButton size="small" onClick={() => handleOpenModelDialog(model)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteModel(model.id)}
                      disabled={modelConfigList.length <= 1}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </CardContent>

      {/* 模型表单对话框 */}
      <Dialog open={openModelDialog} onClose={handleCloseModelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingModel ? t('models.edit') : t('models.add')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
              />
            </Grid>
            {/*api密钥*/}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('models.apiKey')}
                name="apiKey"
                type="password"
                value={modelConfigForm.apiKey}
                onChange={handleModelFormChange}
                placeholder="例如: sk-..."
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
                    />
                  )}
                />
              </FormControl>
              <Button variant="contained" onClick={() => refreshProviderModels()} sx={{ ml: 2 }}>
                {t('models.refresh')}
              </Button>
            </Grid>
            {/* 新增：视觉模型选择项 */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('models.type')}</InputLabel>
                <Select
                  label={t('models.type')}
                  value={modelConfigForm.type || 'text'}
                  onChange={handleModelFormChange}
                  name="type"
                >
                  <MenuItem value="text">{t('models.text')}</MenuItem>
                  <MenuItem value="vision">{t('models.vision')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography id="question-generation-length-slider" gutterBottom>
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
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: '40px' }}>
                  {modelConfigForm.temperature}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography id="question-generation-length-slider" gutterBottom>
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
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: '40px' }}>
                  {modelConfigForm.maxTokens}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModelDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSaveModel}
            variant="contained"
            disabled={!modelConfigForm.providerId || !modelConfigForm.providerName || !modelConfigForm.endpoint}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
