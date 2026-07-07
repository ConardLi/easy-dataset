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
  Pagination,
  TextField,
  InputAdornment,
  Grid,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download,
  Delete as DeleteIcon,
  FilePresent as FileIcon,
  Psychology as PsychologyIcon,
  CheckBox as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectAllIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import TuneIcon from '@mui/icons-material/Tune';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';
import MarkdownViewDialog from '../MarkdownViewDialog';
import AdvancedChunkDialog from '../advanced/AdvancedChunkDialog';
import GaPairsIndicator from '../../mga/GaPairsIndicator';
import DomainTreeActionDialog from './DomainTreeActionDialog';
import i18n from '@/lib/i18n';
import { toast } from 'sonner';

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
  onRefresh, // 新增：刷新文件列表的回调函数
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
  const [generationMode, setGenerationMode] = useState('ai'); // 'ai' 或 'manual'
  const [manualGaPair, setManualGaPair] = useState({
    genreTitle: '',
    genreDesc: '',
    audienceTitle: '',
    audienceDesc: ''
  });

  // 批量删除相关状态
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [domainTreeActionOpen, setDomainTreeActionOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 搜索相关状态
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // 高级分块对话框状态
  const [advancedDialogOpen, setAdvancedDialogOpen] = useState(false);
  const [advancedDialogFile, setAdvancedDialogFile] = useState({ fileId: null, fileName: '' });

  // 获取当前选中的模型信息
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);

  // 后端搜索功能
  const handleSearch = async searchValue => {
    if (typeof onPageChange === 'function') {
      setSearchLoading(true);
      try {
        // 调用父组件的页面变更函数，传递搜索参数
        await onPageChange(1, searchValue); // 搜索时重置到第一页
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 清空搜索
  const handleClearSearch = () => {
    setSearchTerm('');
    // 清空搜索时立即触发搜索
    handleSearch('');
  };

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

    // 如果是手动添加模式，验证手动输入的 GA 对
    if (generationMode === 'manual') {
      if (!manualGaPair.genreTitle || !manualGaPair.audienceTitle) {
        setGenError(t('gaPairs.manualGaPairRequired'));
        return;
      }

      try {
        setGenerating(true);
        setGenError(null);
        setGenResult(null);

        const stringFileIds = array.map(id => String(id));

        const requestData = {
          fileIds: stringFileIds,
          gaPair: manualGaPair,
          appendMode: appendMode
        };

        const response = await fetch(`/api/projects/${projectId}/batch-add-manual-ga`, {
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

          // 成功后清空选择状态和表单
          setArray([]);
          if (typeof sendToFileUploader === 'function') {
            sendToFileUploader([]);
          }
          setManualGaPair({
            genreTitle: '',
            genreDesc: '',
            audienceTitle: '',
            audienceDesc: ''
          });

          // 发送全局刷新事件
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
      return;
    }

    // AI 生成模式
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
      const currentLanguage = i18n.language;

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

  // 批量删除处理函数 - 第一步：打开确认对话框
  const handleBatchDelete = () => {
    if (array.length === 0) {
      return;
    }
    setBatchDeleteDialogOpen(true);
  };

  // 确认批量删除 - 第二步：打开领域树选择对话框
  const confirmBatchDelete = () => {
    setBatchDeleteDialogOpen(false);

    // 检查是否还有其他文件
    const remainingFilesCount = files.total - array.length;

    // 如果删除后没有文件了，直接执行删除（keep 模式）
    if (remainingFilesCount === 0) {
      executeBatchDelete('keep');
      return;
    }

    // 否则打开领域树操作选择对话框
    setDomainTreeActionOpen(true);
  };

  // 处理领域树操作选择
  const handleDomainTreeAction = action => {
    setDomainTreeActionOpen(false);
    executeBatchDelete(action);
  };

  // 执行批量删除 - 第三步：实际删除操作
  const executeBatchDelete = async domainTreeAction => {
    if (array.length === 0) {
      return;
    }

    setDeleting(true);
    // 设置页面 loading 状态
    if (typeof setPageLoading === 'function') {
      setPageLoading(true);
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/batch-delete-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: array,
          domainTreeAction,
          model: selectedModelInfo || {},
          language: i18n.language
        })
      });

      if (!response.ok) {
        throw new Error('批量删除失败');
      }

      const result = await response.json();

      // 清空选择
      setArray([]);
      if (typeof sendToFileUploader === 'function') {
        sendToFileUploader([]);
      }

      // 刷新文件列表
      if (typeof onRefresh === 'function') {
        await onRefresh();
      } else if (typeof onPageChange === 'function') {
        // 回退方案：如果没有 onRefresh，使用 onPageChange
        await onPageChange(1);
      }

      toast.success(
        t('textSplit.batchDeleteSuccess', {
          count: result.deletedCount || array.length,
          defaultValue: `成功删除 ${result.deletedCount || array.length} 个文件`
        })
      );
    } catch (error) {
      console.error('批量删除文件失败:', error);
      toast.error(t('textSplit.batchDeleteFailed', { defaultValue: '批量删除失败' }));
    } finally {
      setDeleting(false);
      // 清除页面 loading 状态
      if (typeof setPageLoading === 'function') {
        setPageLoading(false);
      }
    }
  };

  // 取消批量删除
  const cancelBatchDelete = () => {
    setBatchDeleteDialogOpen(false);
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
      {/* 标题和按钮区域 */}
      <Box sx={{ mb: 2 }}>
        {/* 第一行：标题和按钮 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: isFullscreen && files.total > 0 ? 2 : 0
          }}
        >
          <Typography variant="subtitle1">{t('textSplit.uploadedDocuments', { count: files.total })}</Typography>

          {/* 批量操作按钮 */}
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

              {/* 批量删除按钮 */}
              {array.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleBatchDelete}
                  disabled={loading}
                >
                  {t('textSplit.batchDelete', { count: array.length })}
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

        {/* 第二行：搜索框 - 在全屏展示时显示，或者有搜索内容时显示 */}
        {isFullscreen && (files.total > 0 || searchTerm) && (
          <Box>
            <TextField
              size="small"
              placeholder={t('textSplit.searchFiles', { defaultValue: '搜索文件名...' })}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ width: '100%', maxWidth: 400 }}
            />
            {(searchTerm || searchLoading) && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                {searchLoading
                  ? '搜索中...'
                  : searchTerm
                    ? t('textSplit.searchResults', {
                        count: files?.data?.length || 0,
                        total: files.total,
                        defaultValue: `找到 ${files?.data?.length || 0} 个文件（共 ${files.total} 个）`
                      })
                    : null}
              </Typography>
            )}
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
            {searchTerm
              ? // 搜索无结果
                t('textSplit.noSearchResults', {
                  searchTerm,
                  defaultValue: `未找到包含 "${searchTerm}" 的文件`
                })
              : // 真的没有上传文件
                t('textSplit.noFilesUploaded', {
                  defaultValue: '暂未上传文件'
                })}
          </Typography>
        </Box>
      ) : !files?.data || files.data.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            {searchTerm
              ? // 搜索有结果但当前页没数据
                t('textSplit.noResultsOnCurrentPage', {
                  defaultValue: '当前页面没有搜索结果，请返回第一页查看'
                })
              : // 当前页没数据但总数不为0
                t('textSplit.noDataOnCurrentPage', {
                  defaultValue: '当前页面没有数据'
                })}
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
            dense // 使列表项更紧凑，减少高度
          >
            {files?.data?.map((file, index) => (
              <Box key={index}>
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'nowrap',
                    pr: 0 // 移除右侧内边距，便于自定义操作区域位置
                  }}
                >
                  {/* 文件信息区域 */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden', // 隐藏溢出内容
                      maxWidth: '70%', // 限制文件信息区域最大宽度
                      flexGrow: 1,
                      mr: 2 // 与操作区域保持间距
                    }}
                  >
                    <FileIcon color="primary" sx={{ mr: 1, flexShrink: 0 }} />
                    <Tooltip title={`${file.fileName}（${t('textSplit.viewDetails')}）`}>
                      <ListItemText
                        style={{ cursor: 'pointer', overflow: 'hidden' }}
                        onClick={() => handleViewContent(file.id)}
                        primary={
                          <Typography
                            noWrap // 文本不换行并显示省略号
                            variant="body1"
                            component="div"
                          >
                            {file.fileName}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            noWrap // 文本不换行并显示省略号
                            variant="body2"
                            color="textSecondary"
                            component="div"
                          >
                            {`${formatFileSize(file.size)} · ${new Date(file.createAt).toLocaleString()}`}
                          </Typography>
                        }
                      />
                    </Tooltip>
                  </Box>

                  {/* 操作按钮区域 */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexShrink: 0, // 防止操作区域被压缩
                      alignItems: 'center'
                    }}
                  >
                    <Checkbox
                      sx={{ ml: 1 }}
                      checked={array.includes(String(file.id))}
                      onChange={e => handleCheckboxChange(file.id, e.target.checked)}
                    />
                    <GaPairsIndicator projectId={projectId} fileId={file.id} fileName={file.fileName} />
                    <Tooltip title={t('textSplit.advancedSplit')}>
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setAdvancedDialogFile({ fileId: file.id, fileName: file.fileName });
                          setAdvancedDialogOpen(true);
                        }}
                      >
                        <TuneIcon />
                      </IconButton>
                    </Tooltip>
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

      {/* 高级 Markdown 分块对话框 */}
      <AdvancedChunkDialog
        open={advancedDialogOpen}
        onClose={() => setAdvancedDialogOpen(false)}
        projectId={projectId}
        fileId={advancedDialogFile.fileId}
        fileName={advancedDialogFile.fileName}
        onSaveSuccess={refreshTextChunks}
      />

      {/* 新增：批量生成GA对对话框 */}
      <Dialog open={batchGenDialogOpen} onClose={closeBatchGenDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('gaPairs.batchGenerateTitle')}</DialogTitle>
        <DialogContent>
          {!genResult && (
            <DialogContentText>
              {t('gaPairs.batchGenerateDescription', { count: array.length })}

              {/* 生成方式选择 */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('gaPairs.generationMode')}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={generationMode === 'manual'}
                      onChange={e => setGenerationMode(e.target.checked ? 'manual' : 'ai')}
                      color="primary"
                    />
                  }
                  label={generationMode === 'manual' ? t('gaPairs.manualAddMode') : t('gaPairs.aiGenerateMode')}
                />
              </Box>

              {/* AI 生成模式：显示模型信息 */}
              {generationMode === 'ai' && (
                <>
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
                </>
              )}

              {/* 手动添加模式：显示输入表单 */}
              {generationMode === 'manual' && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('gaPairs.genreTitle')}
                        value={manualGaPair.genreTitle}
                        onChange={e => setManualGaPair({ ...manualGaPair, genreTitle: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('gaPairs.genreDesc')}
                        value={manualGaPair.genreDesc}
                        onChange={e => setManualGaPair({ ...manualGaPair, genreDesc: e.target.value })}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('gaPairs.audienceTitle')}
                        value={manualGaPair.audienceTitle}
                        onChange={e => setManualGaPair({ ...manualGaPair, audienceTitle: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('gaPairs.audienceDesc')}
                        value={manualGaPair.audienceDesc}
                        onChange={e => setManualGaPair({ ...manualGaPair, audienceDesc: e.target.value })}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 追加模式选择 */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch checked={appendMode} onChange={e => setAppendMode(e.target.checked)} color="primary" />
                  }
                  label={`${t('gaPairs.appendMode')}（${t('gaPairs.appendModeDescription')}）`}
                />
              </Box>
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
              disabled={
                generating ||
                array.length === 0 ||
                (generationMode === 'ai' && !projectModel) ||
                (generationMode === 'manual' && (!manualGaPair.genreTitle || !manualGaPair.audienceTitle))
              }
              startIcon={generating ? <CircularProgress size={20} /> : <PsychologyIcon />}
            >
              {generating
                ? t('gaPairs.generating')
                : generationMode === 'manual'
                  ? t('gaPairs.batchAddManual')
                  : t('gaPairs.startGeneration')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={batchDeleteDialogOpen} onClose={cancelBatchDelete} maxWidth="sm" fullWidth>
        <DialogTitle>{t('textSplit.batchDeleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('textSplit.batchDeleteConfirm', {
              count: array.length,
              defaultValue: `确定要删除选中的 ${array.length} 个文件吗？此操作不可恢复。`
            })}
          </DialogContentText>
          <Alert severity="warning" sx={{ my: 2 }}>
            <Typography variant="body2" component="div" fontWeight="medium">
              {t('textSplit.deleteFileWarning')}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" component="div">
                • {t('textSplit.deleteFileWarningChunks')}
              </Typography>
              <Typography variant="body2" component="div">
                • {t('textSplit.deleteFileWarningQuestions')}
              </Typography>
              <Typography variant="body2" component="div">
                • {t('textSplit.deleteFileWarningDatasets')}
              </Typography>
            </Box>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelBatchDelete}>{t('common.cancel')}</Button>
          <Button onClick={confirmBatchDelete} variant="contained" color="error">
            {t('common.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 领域树操作选择对话框 */}
      <DomainTreeActionDialog
        open={domainTreeActionOpen}
        onClose={() => setDomainTreeActionOpen(false)}
        onConfirm={handleDomainTreeAction}
        isFirstUpload={false}
        action="delete"
      />
    </Box>
  );
}
