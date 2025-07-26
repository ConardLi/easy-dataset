'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import UploadArea from './components/UploadArea';
import FileList from './components/FileList';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import PdfProcessingDialog from './components/PdfProcessingDialog';
import DomainTreeActionDialog from './components/DomainTreeActionDialog';
import FileLoadingProgress from './components/FileLoadingProgress';
import { fileApi, taskApi } from '@/lib/api';
import { getContent, checkMaxSize, checkInvalidFiles, getvalidFiles } from '@/lib/file/file-process';
import { toast } from 'sonner';

export default function FileUploader({
  projectId,
  onUploadSuccess,
  onFileDeleted,
  sendToPages,
  setPdfStrategy,
  pdfStrategy,
  selectedViosnModel,
  setSelectedViosnModel,
  setPageLoading,
  taskFileProcessing,
  fileTask
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pdfProcessConfirmOpen, setpdfProcessConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState({});
  const [domainTreeActionOpen, setDomainTreeActionOpen] = useState(false);
  const [domainTreeAction, setDomainTreeAction] = useState('');
  const [isFirstUpload, setIsFirstUpload] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [taskSettings, setTaskSettings] = useState(null);
  const [visionModels, setVisionModels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchFileName, setSearchFileName] = useState('');

  useEffect(() => {
    fetchUploadedFiles();
  }, [currentPage, searchFileName]);

  /**
   * 处理 PDF 处理方式选择
   */
  const handleRadioChange = event => {
    const modelId = event.target.selectedVision;
    setPdfStrategy(event.target.value);

    if (event.target.value === 'mineru') {
      toast.success(t('textSplit.mineruSelected'));
    } else if (event.target.value === 'mineru-local') {
      toast.success(t('textSplit.mineruLocalSelected'));
    } else if (event.target.value === 'vision') {
      const model = visionModels.find(item => item.id === modelId);
      toast.success(
        t('textSplit.customVisionModelSelected', {
          name: model.modelName,
          provider: model.projectName
        })
      );
    } else {
      toast.success(t('textSplit.defaultSelected'));
    }
  };

  /**
   * 获取上传的文件列表
   * @param {*} page
   * @param {*} size
   * @param {*} fileName
   */
  const fetchUploadedFiles = async (page = currentPage, size = pageSize, fileName = searchFileName) => {
    try {
      setLoading(true);
      const data = await fileApi.getFiles({ projectId, page, size, fileName, t });
      setUploadedFiles(data);

      setIsFirstUpload(data.total === 0);

      const taskData = await taskApi.getProjectTasks(projectId);
      setTaskSettings(taskData);

      //使用Jotai会出现数据获取的延迟，导致这里模型获取不到，改用localStorage获取模型信息
      const model = JSON.parse(localStorage.getItem('modelConfigList'));

      //过滤出视觉模型
      const visionItems = model.filter(item => item.type === 'vision' && item.apiKey);

      //先默认选择第一个配置的视觉模型
      if (visionItems.length > 0) {
        setSelectedViosnModel(visionItems[0].id);
      }

      setVisionModels(visionItems);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = event => {
    const selectedFiles = Array.from(event.target.files);

    checkMaxSize(selectedFiles);
    checkInvalidFiles(selectedFiles);

    const validFiles = getvalidFiles(selectedFiles);

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
    const hasPdfFiles = selectedFiles.filter(file => file.name.endsWith('.pdf'));
    if (hasPdfFiles.length > 0) {
      setpdfProcessConfirmOpen(true);
      setPdfFiles(hasPdfFiles);
    }
  };

  /**
   * 从待上传文件列表中移除文件
   */
  const removeFile = index => {
    const fileToRemove = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileToRemove && fileToRemove.name.toLowerCase().endsWith('.pdf')) {
      setPdfFiles(prevPdfFiles => prevPdfFiles.filter(pdfFile => pdfFile.name !== fileToRemove.name));
    }
  };

  /**
   * 上传文件
   */
  const uploadFiles = async () => {
    if (files.length === 0) return;

    // 如果是第一次上传，直接走默认逻辑
    if (isFirstUpload) {
      handleStartUpload('rebuild');
      return;
    }

    // 否则打开领域树操作选择对话框
    setDomainTreeAction('upload');
    setPendingAction({ type: 'upload' });
    setDomainTreeActionOpen(true);
  };

  /**
   * 处理领域树操作选择
   */
  const handleDomainTreeAction = action => {
    setDomainTreeActionOpen(false);

    // 执行挂起的操作
    if (pendingAction && pendingAction.type === 'upload') {
      handleStartUpload(action);
    } else if (pendingAction && pendingAction.type === 'delete') {
      handleDeleteFile(action);
    }

    // 清除挂起的操作
    setPendingAction(null);
  };

  /**
   * 开始上传文件
   */
  const handleStartUpload = async domainTreeActionType => {
    setUploading(true);
    try {
      const uploadedFileInfos = [];
      for (const file of files) {
        const { fileContent, fileName } = await getContent(file);
        const data = await fileApi.uploadFile({ file, projectId, fileContent, fileName, t });
        uploadedFileInfos.push({ fileName: data.fileName, fileId: data.fileId });
      }
      toast.success(t('textSplit.uploadSuccess', { count: files.length }));
      setFiles([]);
      setCurrentPage(1);
      await fetchUploadedFiles();
      if (onUploadSuccess) {
        await onUploadSuccess(uploadedFileInfos, pdfFiles, domainTreeActionType);
      }
    } catch (err) {
      toast.error(err.message || t('textSplit.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirm = (fileId, fileName) => {
    setFileToDelete({ fileId, fileName });
    setDeleteConfirmOpen(true);
  };

  // 关闭删除确认对话框
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };

  // 删除文件前确认领域树操作
  const confirmDeleteFile = () => {
    setDeleteConfirmOpen(false);

    // 如果没有其他文件了（删除后会变为空），直接删除
    if (uploadedFiles.total <= 1) {
      handleDeleteFile('keep');
      return;
    }

    // 否则打开领域树操作选择对话框
    setDomainTreeAction('delete');
    setPendingAction({ type: 'delete' });
    setDomainTreeActionOpen(true);
  };

  // 处理删除文件
  const handleDeleteFile = async domainTreeActionType => {
    if (!fileToDelete) return;

    try {
      setLoading(true);
      closeDeleteConfirm();

      await fileApi.deleteFile({
        fileToDelete,
        projectId,
        domainTreeActionType,
        modelInfo: selectedModelInfo || {},
        t
      });
      await fetchUploadedFiles();

      if (onFileDeleted) {
        const filesLength = uploadedFiles.total;
        onFileDeleted(fileToDelete, filesLength);
      }

      if (uploadedFiles.data && uploadedFiles.data.length <= 1 && currentPage > 1) {
        setCurrentPage(1);
      }

      toast.success(t('textSplit.deleteSuccess', { fileName: fileToDelete.fileName }));
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
      setFileToDelete(null);
    }
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
      {taskFileProcessing ? (
        <FileLoadingProgress fileTask={fileTask} />
      ) : (
        <>
          <Grid container spacing={3}>
            {/* 左侧：上传文件区域 */}
            <Grid item xs={10} md={5} sx={{ maxWidth: '100%', width: '100%' }}>
              <UploadArea
                theme={theme}
                files={files}
                uploading={uploading}
                uploadedFiles={uploadedFiles}
                onFileSelect={handleFileSelect}
                onRemoveFile={removeFile}
                onUpload={uploadFiles}
                selectedModel={selectedModelInfo}
              />
            </Grid>

            {/* 右侧：已上传文件列表 */}
            <Grid item xs={14} md={7} sx={{ maxWidth: '100%', width: '100%' }}>
              <FileList
                theme={theme}
                files={uploadedFiles}
                loading={loading}
                setPageLoading={setPageLoading}
                sendToFileUploader={array => sendToPages(array)}
                onDeleteFile={openDeleteConfirm}
                projectId={projectId}
                currentPage={currentPage}
                onPageChange={(page, fileName) => {
                  if (fileName !== undefined) {
                    // 搜索时更新搜索关键词和页码
                    setSearchFileName(fileName);
                    setCurrentPage(page);
                  } else {
                    // 翻页时只更新页码
                    setCurrentPage(page);
                  }
                }}
              />
            </Grid>
          </Grid>

          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            fileName={fileToDelete?.fileName}
            onClose={closeDeleteConfirm}
            onConfirm={confirmDeleteFile}
          />

          {/* 领域树操作选择对话框 */}
          <DomainTreeActionDialog
            open={domainTreeActionOpen}
            onClose={() => setDomainTreeActionOpen(false)}
            onConfirm={handleDomainTreeAction}
            isFirstUpload={isFirstUpload}
            action={domainTreeAction}
          />
          {/* 检测到pdf的处理框 */}
          <PdfProcessingDialog
            open={pdfProcessConfirmOpen}
            onClose={() => setpdfProcessConfirmOpen(false)}
            onRadioChange={handleRadioChange}
            value={pdfStrategy}
            projectId={projectId}
            taskSettings={taskSettings}
            visionModels={visionModels}
            selectedViosnModel={selectedViosnModel}
            setSelectedViosnModel={setSelectedViosnModel}
          />
        </>
      )}
    </Paper>
  );
}
