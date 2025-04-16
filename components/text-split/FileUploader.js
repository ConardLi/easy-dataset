'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import mammoth from 'mammoth';
import { Paper, Alert, Snackbar, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import UploadArea from './components/UploadArea';
import FileList from './components/FileList';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import PdfProcessingDialog from './components/PdfProcessingDialog';

/**
 * File uploader component
 * @param {Object} props
 * @param {string} props.projectId - Project ID
 * @param {Function} props.onUploadSuccess - Upload success callback
 * @param {Function} props.onProcessStart - Process start callback
 */
export default function FileUploader({ projectId, onUploadSuccess, onProcessStart, onFileDeleted,  sendToPages,  setPdfStrategy,  pdfStrategy, selectedViosnModel, setSelectedViosnModel, setPageLoading }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pdfProcessConfirmOpen, setpdfProcessConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [taskSettings, setTaskSettings] = useState(null);
  const [visionModels,setVisionModels] = useState([]);


  // 设置PDF文件的处理方式
  const handleRadioChange = (event) => {
    // 传递这个值的原因是setSelectedViosnModel是异步的,PdfProcessingDialog检测到模型变更设置新的值
    // 这里没法及时获取到，会导致提示选中的模型仍然是旧模型
    const modelId = event.target.selectedVision;

    setPdfStrategy(event.target.value);

    if(event.target.value === "mineru"){
      setSuccessMessage( t('textSplit.mineruSelected') );
    }else if(event.target.value === "vision"){
      const model = visionModels.find(item => item.id === modelId);
      setSuccessMessage(  t('textSplit.customVisionModelSelected',{
        name: model.name,
        provider: model.provider
      }));
    }else{
      setSuccessMessage( t('textSplit.defaultSelected') );
    }

    setSuccess(true);

  };

  // Load uploaded files list
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  // Fetch uploaded files list
  const fetchUploadedFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/files`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.fetchFilesFailed'));
      }

      const data = await response.json();
      setUploadedFiles(data.files || []);

      //获取到配置信息，用于判断用户是否启用MinerU和视觉大模型
      const taskResponse = await fetch(`/api/projects/${projectId}/tasks`);
      if (!taskResponse.ok) {
        throw new Error(t('settings.fetchTasksFailed'));
      }

      const taskData = await taskResponse.json();

      setTaskSettings(taskData);
    
      //获取配置的视觉模型
      const modelResponse = await fetch(`/api/projects/${projectId}/models`);

      if (!response.ok) {
        throw new Error(t('models.fetchFailed'));
      }

      //获取所有模型
      const model = await modelResponse.json();

      //过滤出视觉模型
      const visionItems = model.filter(item => (item.type === 'vision') &&item.apiKey);

      //先默认选择第一个配置的视觉模型
      if(visionItems.length > 0){
        setSelectedViosnModel(visionItems[0].id);
      }
    
      setVisionModels(visionItems);

    } catch (error) {
      console.error('获取文件列表出错:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = event => {
    const selectedFiles = Array.from(event.target.files);

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      setError(`Max 50MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const supportedFileTypes = ['.md', '.mdx', '.txt', '.docx', '.pdf'];
    const validFiles = selectedFiles.filter(file => supportedFileTypes.some(type => file.name.endsWith(type)));
    const invalidFiles = selectedFiles.filter(file => !supportedFileTypes.some(type => file.name.endsWith(type)) );

    if (invalidFiles.length > 0) {
      setError(t('textSplit.unsupportedFormat', { files: invalidFiles.map(f => f.name).join(', ') }));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
    // If there are PDF files among the uploaded files, let the user choose the way to process the PDF files.
    const hasPdfFiles = selectedFiles.filter(file => file.name.endsWith('.pdf'));
    if (hasPdfFiles.length > 0) {
      setpdfProcessConfirmOpen(true);
      setPdfFiles(hasPdfFiles);
    }
  };

  // 移除文件
  const removeFile = index => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 上传文件
  const uploadFiles = async () => {
    if (files.length === 0) return;

    // 直接开始上传文件，不再打开模型选择对话框
    handleStartUpload();
  };

  // 开始上传文件
  const handleStartUpload = async () => {
    setUploading(true);
    setError(null);

    try {
      // 从 localStorage 获取当前选择的模型信息
      let selectedModelInfo = null;

      // 尝试从 localStorage 获取完整的模型信息
      const modelInfoStr = localStorage.getItem('selectedModelInfo');

      if (modelInfoStr) {
        try {
          selectedModelInfo = JSON.parse(modelInfoStr);
        } catch (e) {
          throw new Error(t('textSplit.modelInfoParseError'));
        }
      } else {
        throw new Error(t('textSplit.selectModelFirst'));
      }

      const uploadedFileNames = [];

      for (const file of files) {
        let fileContent;
        let fileName = file.name;
        let extension = file.name.split('.').pop();

        // 如果是 docx 文件，先转换为 markdown
        if (extension == 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToMarkdown({ arrayBuffer });
          fileContent = result.value;
        } else {
          const reader = new FileReader();
          fileContent = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          });
        }

        if (['md', 'mdx', 'txt', 'docx'].includes(extension)) {
          fileName = fileName.replace(`.${extension}`, '.md');
        }

        // 使用自定义请求头发送文件
        const response = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-file-name': encodeURIComponent(fileName)
          },
          body: file.name.endsWith('.docx') ? new TextEncoder().encode(fileContent) : fileContent
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(t('textSplit.uploadFailed') + errorData.error);
        }

        const data = await response.json();
        uploadedFileNames.push(data.fileName);
      }

      setSuccessMessage(t('textSplit.uploadSuccess', { count: files.length }));
      setSuccess(true);
      setFiles([]);

      await fetchUploadedFiles();

      // 上传成功后，返回文件名列表和选中的模型信息
      if (onUploadSuccess) {
        await onUploadSuccess(uploadedFileNames, selectedModelInfo, pdfFiles);
      }
    } catch (err) {
      setError(err.message || t('textSplit.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirm = fileName => {
    setFileToDelete(fileName);
    setDeleteConfirmOpen(true);
  };

  // 关闭删除确认对话框
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };

  // 关闭PDF处理框
  const closePdfProcessConfirm = () => {
    setpdfProcessConfirmOpen(false);
  }

  // 处理删除文件
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      setLoading(true);
      closeDeleteConfirm();

      const response = await fetch(`/api/projects/${projectId}/files?fileName=${encodeURIComponent(fileToDelete)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.deleteFailed'));
      }

      // 刷新文件列表
      await fetchUploadedFiles();

      // 通知父组件文件已删除，需要刷新文本块列表
      if (onFileDeleted) {
        const filesLength = uploadedFiles.length;
        onFileDeleted(fileToDelete, filesLength);
      }

      setSuccessMessage(t('textSplit.deleteSuccess', { fileName: fileToDelete }));
      setSuccess(true);
    } catch (error) {
      console.error('删除文件出错:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setFileToDelete(null);
    }
  };

  // 关闭错误提示
  const handleCloseError = () => {
    setError(null);
  };

  // 关闭成功提示
  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  const handleSelected = array => {
    sendToPages(array);
  };
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      <Grid container spacing={3}>
        {/* 左侧：上传文件区域 */}
        <Grid item xs={12} md={6} sx={{ maxWidth: '100%', width: '100%' }}>
          <UploadArea
            theme={theme}
            files={files}
            uploading={uploading}
            uploadedFiles={uploadedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={removeFile}
            onUpload={uploadFiles}
          />
        </Grid>

        {/* 右侧：已上传文件列表 */}
        <Grid item xs={12} md={6} sx={{ maxWidth: '100%', width: '100%' }}>
          <FileList
            theme={theme}
            files={uploadedFiles}
            loading={loading}
            setPageLoading={setPageLoading}
            sendToFileUploader={handleSelected}
            onDeleteFile={openDeleteConfirm}
            projectId={projectId}
          />
        </Grid>
      </Grid>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={3000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        fileName={fileToDelete}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteFile}
      />
      {/* 检测到pdf的处理框 */}
      <PdfProcessingDialog
        open={pdfProcessConfirmOpen}
        onClose={closePdfProcessConfirm}
        onRadioChange={handleRadioChange}
        value={pdfStrategy}
        projectId={projectId}
        taskSettings={taskSettings}
        visionModels={visionModels}
        selectedViosnModel={selectedViosnModel}
        setSelectedViosnModel={setSelectedViosnModel}
      />
    </Paper>
  );
}
