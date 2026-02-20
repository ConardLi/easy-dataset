'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Tabs,
  Tab,
  IconButton,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import FileUploader from '@/components/text-split/FileUploader';
import FileList from '@/components/text-split/components/FileList';
import DeleteConfirmDialog from '@/components/text-split/components/DeleteConfirmDialog';
import PdfSettings from '@/components/text-split/PdfSettings';
import ChunkList from '@/components/text-split/ChunkList';
import DomainAnalysis from '@/components/text-split/DomainAnalysis';
import useTaskSettings from '@/hooks/useTaskSettings';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import useChunks from './useChunks';
import useQuestionGeneration from './useQuestionGeneration';
import useDataCleaning from './useDataCleaning';
import useEvalGeneration from './useEvalGeneration';
import useFileProcessing from './useFileProcessing';
import useFileProcessingStatus from '@/hooks/useFileProcessingStatus';
import { toast } from 'sonner';

export default function TextSplitPage({ params }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { projectId } = params;
  const [activeTab, setActiveTab] = useState(0);
  const [renderedTab, setRenderedTab] = useState(0);
  const [tabSwitching, setTabSwitching] = useState(false);
  const tabSwitchTimerRef = useRef(null);
  const { taskSettings } = useTaskSettings(projectId);
  const [pdfStrategy, setPdfStrategy] = useState('default');
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all', 'generated', 'ungenerated'
  const [selectedViosnModel, setSelectedViosnModel] = useState('');
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);
  const { taskFileProcessing, task } = useFileProcessingStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState({ data: [], total: 0 });
  const [searchFileName, setSearchFileName] = useState('');
  const [showLoadingBar, setShowLoadingBar] = useState(false);

  // 娑撳﹣绱堕崠鍝勭厵閻ㄥ嫬鐫嶅鈧?閹舵ê褰旈悩鑸碘偓?
  const [uploaderExpanded, setUploaderExpanded] = useState(true);

  // 閺傚洨灏為崚妤勩€?FileList)鐏炴洜銇氱€电鐦藉鍡欏Ц閹?
  const [fileListDialogOpen, setFileListDialogOpen] = useState(false);

  // 娴ｈ法鏁ら懛顏勭暰娑斿“ooks
  const { chunks, tocData, loading, fetchChunks, handleDeleteChunk, handleEditChunk, updateChunks, setLoading } =
    useChunks(projectId, questionFilter);

  // 閼惧嘲褰囬弬鍥︽閸掓銆?
  const fetchUploadedFiles = async (page = currentPage, fileName = searchFileName) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10'
      });

      if (fileName && fileName.trim()) {
        params.append('fileName', fileName.trim());
      }

      const response = await axios.get(`/api/projects/${projectId}/files?${params}`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error(error.message || '閼惧嘲褰囬弬鍥︽閸掓銆冩径杈Е');
    } finally {
      setLoading(false);
    }
  };

  // 閸掔娀娅庨弬鍥︽绾喛顓荤€电鐦藉鍡欏Ц閹?
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // 閹垫挸绱戦崚鐘绘珟绾喛顓荤€电鐦藉?
  const openDeleteConfirm = (fileId, fileName) => {
    setFileToDelete({ fileId, fileName });
    setDeleteConfirmOpen(true);
  };

  // 閸忔娊妫撮崚鐘绘珟绾喛顓荤€电鐦藉?
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };

  // 绾喛顓婚崚鐘绘珟閺傚洣娆?
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      setLoading(true);
      closeDeleteConfirm();

      await axios.delete(`/api/projects/${projectId}/files/${fileToDelete.fileId}`);
      await fetchUploadedFiles();
      fetchChunks();

      toast.success(t('textSplit.deleteSuccess', { fileName: fileToDelete.fileName }) || `删除 ${fileToDelete.fileName} 成功`);
    } catch (error) {
      console.error('删除文件出错:', error);
      toast.error(error.message || '删除文件失败');
    } finally {
      setLoading(false);
      setFileToDelete(null);
    }
  };

  const { handleGenerateQuestions } = useQuestionGeneration(projectId, taskSettings);
  const { handleDataCleaning } = useDataCleaning(projectId, taskSettings);
  const { handleGenerateEvalQuestions } = useEvalGeneration(projectId);
  const { handleFileProcessing } = useFileProcessing(projectId);

  // 文本块数据刷新：初始化 + 文件处理任务状态变化
  useEffect(() => {
    fetchChunks('all');
  }, [fetchChunks, taskFileProcessing]);

  // 文件列表刷新：文件分页、搜索关键词变化时触发
  useEffect(() => {
    fetchUploadedFiles(currentPage, searchFileName);
  }, [projectId, currentPage, searchFileName]);

  useEffect(() => {
    let timerId;
    if (loading) {
      timerId = setTimeout(() => setShowLoadingBar(true), 180);
    } else {
      setShowLoadingBar(false);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [loading]);

  useEffect(() => {
    return () => {
      if (tabSwitchTimerRef.current) {
        clearTimeout(tabSwitchTimerRef.current);
      }
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    if (newValue === activeTab) return;

    setActiveTab(newValue);
    setTabSwitching(true);

    if (tabSwitchTimerRef.current) {
      clearTimeout(tabSwitchTimerRef.current);
    }

    const switchContent = () => {
      setRenderedTab(newValue);
      tabSwitchTimerRef.current = null;
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => setTabSwitching(false));
      } else {
        setTabSwitching(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        tabSwitchTimerRef.current = setTimeout(switchContent, 80);
      });
    } else {
      switchContent();
    }
  };

  /**
   * 鐎甸€涚瑐娴肩姴鎮楅惃鍕瀮娴犳儼绻樼悰灞筋槱閻?
   */
  const handleUploadSuccess = async (fileNames, pdfFiles, domainTreeAction) => {
    try {
      await handleFileProcessing(fileNames, pdfStrategy, selectedViosnModel, domainTreeAction);
      location.reload();
    } catch (error) {
      toast.error('File upload failed' + error.message || '');
    }
  };

  // 閸栧懓顥婇悽鐔稿灇闂傤噣顣介惃鍕槱閻炲棗鍤遍弫?
  const onGenerateQuestions = async chunkIds => {
    await handleGenerateQuestions(chunkIds, selectedModelInfo, fetchChunks);
  };

  // 閸栧懓顥婇弫鐗堝祦濞撳懏绀傞惃鍕槱閻炲棗鍤遍弫?
  const onDataCleaning = async chunkIds => {
    await handleDataCleaning(chunkIds, selectedModelInfo, fetchChunks);
  };

  // 閸栧懓顥婇悽鐔稿灇濞村鐦庢０妯兼窗閻ㄥ嫬顦╅悶鍡楀毐閺?
  const onGenerateEvalQuestions = async chunkId => {
    await handleGenerateEvalQuestions(chunkId, selectedModelInfo, () => {
      // 閹存劕濮涢崥搴″煕閺傛澘鍨悰?
      fetchChunks();
    });
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
      {/* 閺傚洣娆㈡稉濠佺炊缂佸嫪娆?*/}

      <Box
        sx={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 1, display: 'flex' }}
      >
        <IconButton
          onClick={() => setUploaderExpanded(!uploaderExpanded)}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            mr: uploaderExpanded ? 1 : 0 // 鐏炴洖绱戦弮鑸靛瘻闁筋喕绠ｉ梻瀵告殌閻愬綊妫跨捄?
          }}
          size="small"
        >
          {uploaderExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>

        {/* 閺傚洨灏為崚妤勩€冮幍鈺佺潔閹稿鎸抽敍灞肩矌閸︺劋绗傞柈銊ュ隘閸╃喎鐫嶅鈧弮鑸垫▔缁€?*/}
        {uploaderExpanded && (
          <IconButton
            color="primary"
            onClick={() => setFileListDialogOpen(true)}
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            size="small"
            title={t('textSplit.expandFileList') || '扩展文件列表'}
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

      {/* 閺嶅洨顒锋い?*/}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}
          >
            <Tab label={t('textSplit.tabs.smartSplit')} />
            <Tab label={t('textSplit.tabs.domainAnalysis')} />
          </Tabs>
        </Box>

        {/* 閺呴缚鍏橀崚鍡楀閺嶅洨顒烽崘鍛啇 */}
        {tabSwitching ? (
          <Box
            sx={{
              minHeight: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            <CircularProgress size={26} />
            <Typography variant="body2" color="text.secondary">
              {t('common.loading')}
            </Typography>
          </Box>
        ) : (
          <>
            {renderedTab === 0 && (
              <ChunkList
                projectId={projectId}
                chunks={chunks}
                onDelete={handleDeleteChunk}
                onEdit={handleEditChunk}
                onGenerateQuestions={onGenerateQuestions}
                onGenerateEvalQuestions={onGenerateEvalQuestions}
                onDataCleaning={onDataCleaning}
                loading={loading}
                questionFilter={questionFilter}
                setQuestionFilter={setQuestionFilter}
                selectedModel={selectedModelInfo}
              />
            )}

            {renderedTab === 1 && <DomainAnalysis projectId={projectId} toc={tocData} loading={loading} />}
          </>
        )}
      </Box>

      {/* 閸旂姾娴囨稉顓℃寢閻?*/}
      {showLoadingBar && (
        <Box sx={{ position: 'sticky', bottom: 12, zIndex: 5, px: 1 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              px: 1.5,
              py: 1,
              boxShadow: 1
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {t('textSplit.loading')}
            </Typography>
            <LinearProgress />
          </Box>
        </Box>
      )}

      {/* 婢跺嫮鎮婃稉顓℃寢閻?*/}

      {/* 閺佺増宓佸〒鍛鏉╂稑瀹抽拏娆戝 */}

      {/* 閺傚洣娆㈡径鍕倞鏉╂稑瀹抽拏娆戝 */}

      {/* 閺傚洣娆㈤崚鐘绘珟绾喛顓荤€电鐦藉?*/}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        fileName={fileToDelete?.fileName}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteFile}
      />

      {/* 閺傚洨灏為崚妤勩€冪€电鐦藉?*/}
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
          {/* 濮濄倕顦╂径宥囨暏 FileUploader 缂佸嫪娆㈡稉顓犳畱 FileList 闁劌鍨?*/}
          <Box sx={{ minHeight: '80vh' }}>
            {/* 閺傚洣娆㈤崚妤勩€冮崘鍛啇 */}
            <FileList
              theme={theme}
              files={uploadedFiles}
              loading={loading}
              setPageLoading={setLoading}
              sendToFileUploader={array => handleSelected(array)}
              onDeleteFile={(fileId, fileName) => openDeleteConfirm(fileId, fileName)}
              projectId={projectId}
              currentPage={currentPage}
              onPageChange={(page, fileName) => {
                if (fileName !== undefined) {
                  // 閹兼粎鍌ㄩ弮鑸垫纯閺傜増鎮崇槐銏犲彠闁款喛鐦濋崪宀勩€夐惍?
                  setSearchFileName(fileName);
                  setCurrentPage(page);
                } else {
                  // 缂堝銆夐弮璺哄涧閺囧瓨鏌婃い鐢电垳
                  setCurrentPage(page);
                }
              }}
              onRefresh={fetchUploadedFiles} // 娴肩娀鈧帒鍩涢弬鏉垮毐閺?
              isFullscreen={true} // 閸︺劌顕拠婵囶攱娑擃厾些闂勩倝鐝惔锕傛閸?
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

