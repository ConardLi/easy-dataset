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
    return <Typography>{t('textSplit.loading')}</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {t('settings.modelConfig')}
          </Typography>
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

        {(!modelConfigList || modelConfigList.length === 0) && (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: 'background.default',
              mb: 1
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('models.unselectedModel')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('models.typeTips')}
            </Typography>
            <Button variant="contained" onClick={() => handleOpenModelDialog()} startIcon={<AddIcon />}>
              {t('models.add')}
            </Button>
          </Box>
        )}

        {!!modelConfigList?.length && (
          <Stack spacing={1.5}>
            {modelConfigList.map(model => (
              <Paper
                key={model.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.light',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                    <ProviderIcon key={model.providerId} provider={model.providerId} size={32} type={'color'} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {model.modelName ? model.modelName : t('models.unselectedModel')}
                      </Typography>
                      <Chip
                        label={model.providerName}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 0.5, maxWidth: 200 }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Tooltip title={getModelStatusInfo(model).text}>
                      <Chip
                        icon={getModelStatusInfo(model).icon}
                        label={`${formatEndpoint(model)}${
                          model.providerId.toLowerCase() !== 'ollama' && !model.apiKey
                            ? ' (' + t('models.unconfiguredAPIKey') + ')'
                            : ''
                        }`}
                        size="small"
                        color={getModelStatusInfo(model).color}
                        variant="outlined"
                        sx={{ maxWidth: 360 }}
                      />
                    </Tooltip>
                    <Tooltip title={t('models.typeTips')}>
                      <Chip
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
        )}
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
            <Grid item xs={12}>
              <Typography id="top-p-slider" gutterBottom>
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
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: '40px' }}>
                  {modelConfigForm.topP}
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
