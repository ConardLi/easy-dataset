'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import FileUploader from '@/components/text-split/FileUploader';
import FileList from '@/components/text-split/components/FileList';
import DeleteConfirmDialog from '@/components/text-split/components/DeleteConfirmDialog';
import LoadingBackdrop from '@/components/text-split/LoadingBackdrop';
import PdfSettings from '@/components/text-split/PdfSettings';
import ChunkList from '@/components/text-split/ChunkList';
import DomainAnalysis from '@/components/text-split/DomainAnalysis';
import useTaskSettings from '@/hooks/useTaskSettings';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import useChunks from './useChunks';
import useQuestionGeneration from './useQuestionGeneration';
import useFileProcessing from './useFileProcessing';
import useFileProcessingStatus from '@/hooks/useFileProcessingStatus';
import { toast } from 'sonner';

export default function TextSplitPage({ params }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = params;
  const [activeTab, setActiveTab] = useState(0);
  const { taskSettings } = useTaskSettings(projectId);
  const [pdfStrategy, setPdfStrategy] = useState('default');
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all', 'generated', 'ungenerated'
  const [selectedViosnModel, setSelectedViosnModel] = useState('');
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);
  const { taskFileProcessing, task } = useFileProcessingStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState({ data: [], total: 0 });

  // 上传区域的展开/折叠状态
  const [uploaderExpanded, setUploaderExpanded] = useState(true);

  // 文献列表(FileList)展示对话框状态
  const [fileListDialogOpen, setFileListDialogOpen] = useState(false);

  // 使用自定义hooks
  const { chunks, tocData, loading, fetchChunks, handleDeleteChunk, handleEditChunk, updateChunks, setLoading } =
    useChunks(projectId, questionFilter);

  // 获取文件列表
  const fetchUploadedFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}/files?page=${currentPage}&size=10`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error(error.message || '获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除文件确认对话框状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

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

  // 确认删除文件
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      setLoading(true);
      closeDeleteConfirm();

      await axios.delete(`/api/projects/${projectId}/files/${fileToDelete.fileId}`);
      await fetchUploadedFiles();
      fetchChunks();

      toast.success(
        t('textSplit.deleteSuccess', { fileName: fileToDelete.fileName }) || `删除 ${fileToDelete.fileName} 成功`
      );
    } catch (error) {
      console.error('删除文件出错:', error);
      toast.error(error.message || '删除文件失败');
    } finally {
      setLoading(false);
      setFileToDelete(null);
    }
  };

  const {
    processing,
    progress: questionProgress,
    handleGenerateQuestions
  } = useQuestionGeneration(projectId, taskSettings);

  const { fileProcessing, progress: pdfProgress, handleFileProcessing } = useFileProcessing(projectId);

  // 当前页面使用的进度状态
  const progress = processing ? questionProgress : pdfProgress;

  // 加载文本块数据和文件列表
  useEffect(() => {
    fetchChunks('all');
    fetchUploadedFiles();
  }, [fetchChunks, taskFileProcessing, currentPage]);

  /**
   * 对上传后的文件进行处理
   */
  const handleUploadSuccess = async (fileNames, pdfFiles, domainTreeAction) => {
    try {
      await handleFileProcessing(fileNames, pdfStrategy, selectedViosnModel, domainTreeAction);
      location.reload();
    } catch (error) {
      toast.error('File upload failed' + error.message || '');
    }
  };

  // 包装生成问题的处理函数
  const onGenerateQuestions = async chunkIds => {
    await handleGenerateQuestions(chunkIds, selectedModelInfo, fetchChunks);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (questionFilter !== 'all') {
      url.searchParams.set('filter', questionFilter);
    } else {
      url.searchParams.delete('filter');
    }
    window.history.replaceState({}, '', url);
    fetchChunks(questionFilter);
  }, [questionFilter]);

  const handleSelected = array => {
    if (array.length > 0) {
      axios.post(`/api/projects/${projectId}/chunks`, { array }).then(response => {
        updateChunks(response.data);
      });
    } else {
      fetchChunks();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8, position: 'relative' }}>
      {/* 文件上传组件 */}

      <Box
        sx={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 1, display: 'flex' }}
      >
        <IconButton
          onClick={() => setUploaderExpanded(!uploaderExpanded)}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            mr: uploaderExpanded ? 1 : 0 // 展开时按钮之间留点间距
          }}
          size="small"
        >
          {uploaderExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>

        {/* 文献列表扩展按钮，仅在上部区域展开时显示 */}
        {uploaderExpanded && (
          <IconButton
            color="primary"
            onClick={() => setFileListDialogOpen(true)}
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            size="small"
            title={t('textSplit.expandFileList') || '扩展文献列表'}
          >
            <FullscreenIcon />
          </IconButton>
        )}
      </Box>

      <Collapse in={uploaderExpanded}>
        <FileUploader
          projectId={projectId}
          onUploadSuccess={handleUploadSuccess}
          onFileDeleted={fetchChunks}
          setPageLoading={setLoading}
          sendToPages={handleSelected}
          setPdfStrategy={setPdfStrategy}
          pdfStrategy={pdfStrategy}
          selectedViosnModel={selectedViosnModel}
          setSelectedViosnModel={setSelectedViosnModel}
          taskFileProcessing={taskFileProcessing}
          fileTask={task}
        >
          <PdfSettings
            pdfStrategy={pdfStrategy}
            setPdfStrategy={setPdfStrategy}
            selectedViosnModel={selectedViosnModel}
            setSelectedViosnModel={setSelectedViosnModel}
          />
        </FileUploader>
      </Collapse>

      {/* 标签页 */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => {
              setActiveTab(newValue);
            }}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}
          >
            <Tab label={t('textSplit.tabs.smartSplit')} />
            <Tab label={t('textSplit.tabs.domainAnalysis')} />
          </Tabs>
        </Box>

        {/* 智能分割标签内容 */}
        {activeTab === 0 && (
          <ChunkList
            projectId={projectId}
            chunks={chunks}
            onDelete={handleDeleteChunk}
            onEdit={handleEditChunk}
            onGenerateQuestions={onGenerateQuestions}
            loading={loading}
            questionFilter={questionFilter}
            setQuestionFilter={setQuestionFilter}
            selectedModel={selectedModelInfo}
          />
        )}

        {/* 领域分析标签内容 */}
        {activeTab === 1 && <DomainAnalysis projectId={projectId} toc={tocData} loading={loading} />}
      </Box>

      {/* 加载中蒙版 */}
      <LoadingBackdrop open={loading} title={t('textSplit.loading')} description={t('textSplit.fetchingDocuments')} />

      {/* 处理中蒙版 */}
      <LoadingBackdrop open={processing} title={t('textSplit.processing')} progress={progress} />

      {/* 文件处理进度蒙版 */}
      <LoadingBackdrop open={fileProcessing} title={t('textSplit.pdfProcessing')} progress={progress} />

      {/* 文件删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        fileName={fileToDelete?.fileName}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteFile}
      />

      {/* 文献列表对话框 */}
      <Dialog
        open={fileListDialogOpen}
        onClose={() => setFileListDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { bgcolor: 'background.default' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1 }}>
          <Typography variant="h6">{t('textSplit.fileList')}</Typography>
          <IconButton edge="end" color="inherit" onClick={() => setFileListDialogOpen(false)} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {/* 此处复用 FileUploader 组件中的 FileList 部分 */}
          <Box sx={{ minHeight: '80vh' }}>
            {/* 文件列表内容 */}
            <FileList
              theme={theme}
              files={uploadedFiles}
              loading={loading}
              setPageLoading={setLoading}
              sendToFileUploader={array => handleSelected(array)}
              onDeleteFile={(fileId, fileName) => openDeleteConfirm(fileId, fileName)}
              projectId={projectId}
              currentPage={currentPage}
              onPageChange={page => setCurrentPage(page)}
              isFullscreen={true} // 在对话框中移除高度限制
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
