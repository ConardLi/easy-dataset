'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Tabs, Tab } from '@mui/material';
import FileUploader from '@/components/text-split/FileUploader';
import LoadingBackdrop from '@/components/text-split/LoadingBackdrop';
import PdfProcessingBackdrop from '@/components/text-split/PdfProcessingBackdrop';
import MessageAlert from '@/components/common/MessageAlert';
import PdfSettings from '@/components/text-split/PdfSettings';
import ChunkList from '@/components/text-split/ChunkList';
import DomainAnalysis from '@/components/text-split/DomainAnalysis';
import useTaskSettings from '@/hooks/useTaskSettings';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import axios from 'axios';

// 自定义hooks
import useChunks from '@/app/projects/[projectId]/text-split/useChunks';
import useQuestionGeneration from '@/app/projects/[projectId]/text-split/useQuestionGeneration';
import usePdfProcessing from '@/app/projects/[projectId]/text-split/usePdfProcessing';
import useTextSplit from '@/app/projects/[projectId]/text-split/useTextSplit';

export default function TextSplitPage({ params }) {
  const { t } = useTranslation();
  const { projectId } = params;
  const [activeTab, setActiveTab] = useState(0);
  const { taskSettings } = useTaskSettings(projectId);
  const [pdfStrategy, setPdfStrategy] = useState('default');
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all', 'generated', 'ungenerated'
  const [selectedViosnModel, setSelectedViosnModel] = useState('');
  const selectedModelInfo = useAtomValue(selectedModelInfoAtom);

  // 使用自定义hooks
  const {
    chunks,
    tocData,
    loading,
    error,
    setError,
    fetchChunks,
    handleDeleteChunk,
    handleEditChunk,
    updateChunks,
    addChunks,
    updateTocData,
    setLoading
  } = useChunks(projectId);

  const {
    processing,
    progress: questionProgress,
    handleGenerateQuestions
  } = useQuestionGeneration(projectId, taskSettings);

  const { pdfProcessing, progress: pdfProgress, handlePdfProcessing, pageProfress } = usePdfProcessing(projectId);

  const { handleSplitText, handleUploadSuccess: handleTextUploadSuccess } = useTextSplit(
    projectId,
    addChunks,
    updateTocData,
    fetchChunks
  );

  // 当前页面使用的进度状态
  const progress = processing ? questionProgress : pdfProgress;

  // 加载文本块数据
  useEffect(() => {
    fetchChunks();
  }, [fetchChunks]);

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 文件上传成功的包装函数
  const handleUploadSuccess = async (fileNames, pdfFiles, domainTreeAction) => {
    // 处理PDF文件
    if (pdfFiles && pdfFiles.length > 0) {
      await handlePdfProcessing(pdfFiles, pdfStrategy, selectedViosnModel, setError);
    }

    // 处理文本分割
    if (fileNames && fileNames.length > 0) {
      await handleSplitText(fileNames, selectedModelInfo, setError, setActiveTab, domainTreeAction);
    }
  };

  // 包装生成问题的处理函数
  const onGenerateQuestions = async chunkIds => {
    await handleGenerateQuestions(chunkIds, selectedModelInfo, setError, fetchChunks);
  };

  // 处理文件删除
  const handleFileDeleted = (fileName, filesCount) => {
    console.log(t('textSplit.fileDeleted', { fileName }));
    // 替换location.reload()为数据刷新
    fetchChunks();
  };

  // 关闭错误提示
  const handleCloseError = () => {
    setError(null);
  };

  // 处理错误或成功提示
  const renderAlert = () => {
    return <MessageAlert message={error} onClose={handleCloseError} />;
  };

  // 处理筛选器变更
  useEffect(() => {
    fetchChunks();
  }, [questionFilter, fetchChunks]);

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
      <FileUploader
        projectId={projectId}
        onUploadSuccess={handleUploadSuccess}
        onProcessStart={handleSplitText}
        onFileDeleted={handleFileDeleted}
        setPageLoading={setLoading}
        sendToPages={handleSelected}
        setPdfStrategy={setPdfStrategy}
        pdfStrategy={pdfStrategy}
        selectedViosnModel={selectedViosnModel}
        setSelectedViosnModel={setSelectedViosnModel}
      >
        <PdfSettings
          pdfStrategy={pdfStrategy}
          setPdfStrategy={setPdfStrategy}
          selectedViosnModel={selectedViosnModel}
          setSelectedViosnModel={setSelectedViosnModel}
        />
      </FileUploader>

      {/* 标签页 */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label={t('textSplit.tabs.smartSplit')} />
          <Tab label={t('textSplit.tabs.domainAnalysis')} />
        </Tabs>

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
          />
        )}

        {/* 领域分析标签内容 */}
        {activeTab === 1 && <DomainAnalysis projectId={projectId} toc={tocData} loading={loading} />}
      </Box>

      {/* 加载中蒙版 */}
      <LoadingBackdrop open={loading} title={t('textSplit.loading')} description={t('textSplit.fetchingDocuments')} />

      {/* 处理中蒙版 */}
      <LoadingBackdrop open={processing} title={t('textSplit.processing')} progress={progress} />

      {/* PDF 处理进度蒙版 */}
      <PdfProcessingBackdrop
        open={pdfProcessing}
        title={t('textSplit.pdfProcessing')}
        progress={progress}
        pageProfress={pageProfress}
      />

      {/* 错误或成功提示 */}
      {renderAlert()}
    </Container>
  );
}
