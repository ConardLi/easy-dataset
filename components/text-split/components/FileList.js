'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Switch,
  Pagination
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download,
  Delete as DeleteIcon,
  FilePresent as FileIcon,
  Psychology as PsychologyIcon,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';
import MarkdownViewDialog from '../MarkdownViewDialog';
import GaPairsIndicator from '../../mga/GaPairsIndicator';
import i18n from '@/lib/i18n';

export default function FileList({
  theme,
  files = {},
  loading = false,
  onDeleteFile,
  sendToFileUploader,
  projectId,
  setPageLoading,
  currentPage = 1,
  onPageChange,
  isFullscreen = false // 新增参数，用于控制是否处于全屏状态
}) {
  const { t } = useTranslation();

  // 现有的状态
  const [array, setArray] = useState([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewContent, setViewContent] = useState('');

  // 新增的批量生成GA对相关状态
  const [batchGenDialogOpen, setBatchGenDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genResult, setGenResult] = useState(null);
  const [projectModel, setProjectModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [appendMode, setAppendMode] = useState(false);

  // 获取当前选中的模型信息
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);

  const handleCheckboxChange = (fileId, isChecked) => {
    setArray(prevArray => {
      let newArray;
      const stringFileId = String(fileId);

      if (isChecked) {
        newArray = prevArray.includes(stringFileId) ? prevArray : [...prevArray, stringFileId];
      } else {
        newArray = prevArray.filter(item => item !== stringFileId);
      }

      if (typeof sendToFileUploader === 'function') {
        sendToFileUploader(newArray);
      }
      return newArray;
    });
  };

  // 全选文件（包括所有页面的文件）
  const handleSelectAll = async () => {
    try {
      // 获取项目中所有文件的ID
      const response = await fetch(`/api/projects/${projectId}/files?getAllIds=true`);
      if (!response.ok) {
        throw new Error('获取文件列表失败');
      }

      const data = await response.json();
      const allFileIds = data.allFileIds || [];

      setArray(allFileIds);
      if (typeof sendToFileUploader === 'function') {
        sendToFileUploader(allFileIds);
      }
    } catch (error) {
      console.error('全选文件失败:', error);
      // 如果API调用失败，回退到选择当前页面的文件
      if (files?.data?.length > 0) {
        const currentPageFileIds = files.data.map(file => String(file.id));
        setArray(currentPageFileIds);
        if (typeof sendToFileUploader === 'function') {
          sendToFileUploader(currentPageFileIds);
        }
      }
    }
  };
  // 取消全选
  const handleDeselectAll = () => {
    setArray([]);
    if (typeof sendToFileUploader === 'function') {
      sendToFileUploader([]);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  // 刷新文本块列表
  const refreshTextChunks = () => {
    if (typeof setPageLoading === 'function') {
      setPageLoading(true);
      setTimeout(() => {
        // 可能需要调用父组件的刷新方法
        sendToFileUploader(array);
        setPageLoading(false);
      }, 500);
    }
  };

  const handleViewContent = async fileId => {
    getFileContent(fileId);
    setViewDialogOpen(true);
  };

  const handleDownload = async (fileId, fileName) => {
    setPageLoading(true);
    const text = await getFileContent(fileId);

    // Modify the filename if it ends with .pdf
    let downloadName = fileName || 'download.txt';
    if (downloadName.toLowerCase().endsWith('.pdf')) {
      downloadName = downloadName.slice(0, -4) + '.md';
    }

    const blob = new Blob([text.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setPageLoading(false);
  };

  const getFileContent = async fileId => {
    try {
      const response = await fetch(`/api/projects/${projectId}/preview/${fileId}`);
      if (!response.ok) {
        throw new Error(t('textSplit.fetchChunksFailed'));
      }
      const data = await response.json();
      setViewContent(data);
      return data;
    } catch (error) {
      console.error(t('textSplit.fetchChunksError'), error);
    }
  };

  const formatFileSize = size => {
    if (size < 1024) {
      return size + 'B';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + 'KB';
    } else if (size < 1024 * 1024 * 1024) {
      return (size / 1024 / 1024).toFixed(2) + 'MB';
    } else {
      return (size / 1024 / 1024 / 1024).toFixed(2) + 'GB';
    }
  };

  // 新增：获取项目特定的默认模型信息
  const fetchProjectModel = async () => {
    try {
      setLoadingModel(true);

      // 首先获取项目信息
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(t('gaPairs.fetchProjectInfoFailed', { status: response.status }));
      }

      const projectData = await response.json();

      // 获取模型配置
      const modelResponse = await fetch(`/api/projects/${projectId}/model-config`);
      if (!modelResponse.ok) {
        throw new Error(t('gaPairs.fetchModelConfigFailed', { status: modelResponse.status }));
      }

      const modelConfigData = await modelResponse.json();

      if (modelConfigData.data && Array.isArray(modelConfigData.data)) {
        // 优先使用项目默认模型
        let targetModel = null;

        if (projectData.defaultModelConfigId) {
          targetModel = modelConfigData.data.find(model => model.id === projectData.defaultModelConfigId);
        }

        // 如果没有默认模型，使用第一个可用的模型
        if (!targetModel) {
          targetModel = modelConfigData.data.find(
            m => m.modelName && m.endpoint && (m.providerId === 'ollama' || m.apiKey)
          );
        }

        if (targetModel) {
          setProjectModel(targetModel);
        }
      }
    } catch (error) {
      console.error(t('gaPairs.fetchProjectModelError'), error);
    } finally {
      setLoadingModel(false);
    }
  };

  // 新增：批量生成GA对的处理函数
  const handleBatchGenerateGAPairs = async () => {
    if (array.length === 0) {
      setGenError(t('gaPairs.selectAtLeastOneFile'));
      return;
    }

    const modelToUse = projectModel || selectedModelInfo;

    if (!modelToUse || !modelToUse.id) {
      setGenError(t('gaPairs.noDefaultModel'));
      return;
    }

    // 检查模型配置是否完整
    if (!modelToUse.modelName || !modelToUse.endpoint) {
      setGenError('模型配置不完整，请检查模型设置');
      return;
    }

    // 检查API密钥（除了ollama模型）
    if (modelToUse.providerId !== 'ollama' && !modelToUse.apiKey) {
      setGenError(t('gaPairs.missingApiKey'));
      return;
    }

    try {
      setGenerating(true);
      setGenError(null);
      setGenResult(null);

      const stringFileIds = array.map(id => String(id));

      // 获取当前语言环境
      const currentLanguage = i18n.language === 'en' ? 'en' : '中文';

      const requestData = {
        fileIds: stringFileIds,
        modelConfigId: modelToUse.id,
        language: currentLanguage,
        appendMode: appendMode
      };

      const response = await fetch(`/api/projects/${projectId}/batch-generateGA`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: t('gaPairs.requestFailed', { status: response.status }) }));
        throw new Error(errorData.error || t('gaPairs.requestFailed', { status: response.status }));
      }

      const result = JSON.parse(responseText);

      if (result.success) {
        setGenResult({
          total: result.data?.length || 0,
          success: result.data?.filter(r => r.success).length || 0
        });

        // 成功后清空选择状态
        setArray([]);
        if (typeof sendToFileUploader === 'function') {
          sendToFileUploader([]);
        }

        console.log(t('gaPairs.batchGenerationSuccess', { count: result.summary?.success || 0 }));

        //发送全局刷新事件
        const successfulFileIds = result.data?.filter(item => item.success)?.map(item => String(item.fileId)) || [];

        if (successfulFileIds.length > 0) {
          window.dispatchEvent(
            new CustomEvent('refreshGaPairsIndicators', {
              detail: {
                projectId,
                fileIds: successfulFileIds
              }
            })
          );
        }
      } else {
        setGenError(result.error || t('gaPairs.generationFailed'));
      }
    } catch (error) {
      console.error(t('gaPairs.batchGenerationFailed'), error);
      setGenError(t('gaPairs.generationError', { error: error.message || t('common.unknownError') }));
    } finally {
      setGenerating(false);
    }
  };

  // 新增：打开批量生成对话框
  const openBatchGenDialog = () => {
    // 如果没有选中文件，自动选中所有文件
    if (array.length === 0 && files?.data?.length > 0) {
      const allFileIds = files.data.map(file => String(file.id));
      setArray(allFileIds);
      if (typeof sendToFileUploader === 'function') {
        sendToFileUploader(allFileIds);
      }
    }

    // 获取项目模型配置
    fetchProjectModel();
    setBatchGenDialogOpen(true);
  };

  // 新增：关闭批量生成对话框
  const closeBatchGenDialog = () => {
    setBatchGenDialogOpen(false);
    setGenError(null);
    setGenResult(null);
    setAppendMode(false); // 重置追加模式
  };

  return (
    <Box
      sx={{
        height: '100%',
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 修改标题部分，添加批量生成按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">{t('textSplit.uploadedDocuments', { count: files.total })}</Typography>

        {/* 批量生成GA对按钮 */}
        {files.total > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* 全选/取消全选按钮 */}
            {array.length === files.total ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SelectAllIcon />}
                onClick={handleDeselectAll}
                disabled={loading}
              >
                {t('gaPairs.deselectAllFiles')}
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DeselectAllIcon />}
                onClick={handleSelectAll}
                disabled={loading}
              >
                {t('gaPairs.selectAllFiles')}
              </Button>
            )}

            {/* 批量生成GA对按钮 */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PsychologyIcon />}
              onClick={openBatchGenDialog}
              disabled={loading}
            >
              {t('gaPairs.batchGenerate')}
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : files.total === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            {t('textSplit.noFilesUploaded')}
          </Typography>
        </Box>
      ) : (
        <>
          <List
            sx={{
              maxHeight: isFullscreen ? 'none' : '200px', // 根据 isFullscreen 控制最大高度
              overflow: 'auto',
              width: '100%'
            }}
          >
            {files?.data?.map((file, index) => (
              <Box key={index}>
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex' }}>
                      <Checkbox
                        sx={{ mr: 1 }}
                        checked={array.includes(String(file.id))}
                        onChange={e => handleCheckboxChange(file.id, e.target.checked)}
                      />
                      <GaPairsIndicator projectId={projectId} fileId={file.id} fileName={file.fileName} />
                      {/* <Tooltip title={t('textSplit.viewDetails')}>
                      <IconButton color="primary" onClick={() => handleViewContent(file.id)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip> */}
                      <Tooltip title={t('textSplit.download')}>
                        <IconButton color="primary" onClick={() => handleDownload(file.id, file.fileName)}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('textSplit.deleteFile')}>
                        <IconButton color="error" onClick={() => onDeleteFile(file.id, file.fileName)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FileIcon color="primary" sx={{ mr: 1 }} />
                    <Tooltip title={`${file.fileName}（${t('textSplit.viewDetails')}）`}>
                      <ListItemText
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleViewContent(file.id)}
                        primary={file.fileName}
                        secondary={`${formatFileSize(file.size)} · ${new Date(file.createAt).toLocaleString()}`}
                      />
                    </Tooltip>
                  </Box>
                </ListItem>
                {index < files.data.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          {/* 分页控件 */}
          {files.total > 10 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(files.total / 10)} // 假设每页10个文件
                page={currentPage}
                onChange={(event, page) => onPageChange && onPageChange(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* 现有的文本块详情对话框 */}
      <MarkdownViewDialog
        open={viewDialogOpen}
        text={viewContent}
        onClose={handleCloseViewDialog}
        projectId={projectId}
        onSaveSuccess={refreshTextChunks}
      />

      {/* 新增：批量生成GA对对话框 */}
      <Dialog open={batchGenDialogOpen} onClose={closeBatchGenDialog} maxWidth="md" fullWidth>
        <DialogTitle>批量生成GA对</DialogTitle>
        <DialogContent>
          {!genResult && (
            <DialogContentText>
              {t('gaPairs.batchGenerateDescription', { count: array.length })}

              {/* 追加模式选择 */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch checked={appendMode} onChange={e => setAppendMode(e.target.checked)} color="primary" />
                  }
                  label={`${t('gaPairs.appendMode')}（${t('gaPairs.appendModeDescription')}）`}
                />
              </Box>

              {loadingModel ? (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="body2">{t('gaPairs.loadingProjectModel')}</Typography>
                </Box>
              ) : projectModel ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {t('gaPairs.usingModel')}:{' '}
                    <strong>
                      {projectModel.providerName}: {projectModel.modelName}
                    </strong>
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="error">
                    {t('gaPairs.noDefaultModel')}
                  </Typography>
                </Box>
              )}
            </DialogContentText>
          )}

          {genError && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.contrastText">
                {genError}
              </Typography>
            </Box>
          )}

          {genResult && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body2" color="success.contrastText">
                {t('gaPairs.batchGenCompleted', { success: genResult.success, total: genResult.total })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBatchGenDialog}>{genResult ? t('common.close') : t('common.cancel')}</Button>
          {!genResult && (
            <Button
              onClick={handleBatchGenerateGAPairs}
              variant="contained"
              disabled={generating || array.length === 0 || !projectModel}
              startIcon={generating ? <CircularProgress size={20} /> : <PsychologyIcon />}
            >
              {generating ? t('gaPairs.generating') : t('gaPairs.startGeneration')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
