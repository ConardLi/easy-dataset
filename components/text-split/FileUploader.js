'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import mammoth from 'mammoth';
import {
  Paper,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import UploadArea from './components/UploadArea';
import FileList from './components/FileList';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

/**
 * File uploader component
 * @param {Object} props
 * @param {string} props.projectId - Project ID
 * @param {Function} props.onUploadSuccess - Upload success callback
 * @param {Function} props.onProcessStart - Process start callback
 */
export default function FileUploader({ projectId, onUploadSuccess, onProcessStart, onFileDeleted,sendToPages }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
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
    } catch (error) {
      console.error('获取文件列表出错:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (event) => {

    const selectedFiles = Array.from(event.target.files);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      setError(`Max 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // 检查文件类型
    const validFiles = selectedFiles.filter(file => 
      file.name.endsWith('.md') || 
      file.name.endsWith('.txt') || 
      file.name.endsWith('.docx')
    );
    const invalidFiles = selectedFiles.filter(file => 
      !file.name.endsWith('.md') && 
      !file.name.endsWith('.txt') && 
      !file.name.endsWith('.docx')
    );

    if (invalidFiles.length > 0) {
      setError(t('textSplit.unsupportedFormat', { files: invalidFiles.map(f => f.name).join(', ') }));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  // 移除文件
  const removeFile = (index) => {
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

        // 如果是 docx 文件，先转换为 markdown
        if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToMarkdown({ arrayBuffer });
          fileContent = result.value;
          fileName = file.name.replace('.docx', '.md');
        } else {
          // 对于 md 和 txt 文件，直接读取内容
          const reader = new FileReader();
          fileContent = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          });
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
        onUploadSuccess(uploadedFileNames, selectedModelInfo);
      }
    } catch (err) {
      setError(err.message || t('textSplit.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirm = (fileName) => {
    setFileToDelete(fileName);
    setDeleteConfirmOpen(true);
  };

  // 关闭删除确认对话框
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };

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
        onFileDeleted(fileToDelete);
      }

      setSuccessMessage(t('textSplit.deleteSuccess', { fileName: fileToDelete }));
      setSuccess(true);
      location.reload();
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

  const handleSelected = (array)  =>{
    sendToPages(array);
  }
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
      <Grid container spacing={3} >
        {/* 左侧：上传文件区域 */}
        <Grid item xs={12} md={6} sx={{ maxWidth: '100%', width: '100%'  }}>
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
            sendToFileUploader={handleSelected}
            onDeleteFile={openDeleteConfirm}
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
    </Paper>
  );
}
