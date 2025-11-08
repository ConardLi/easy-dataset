'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';
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
  Paper,
  useMediaQuery,
  Grid,
  Chip,
  Stack,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FileUploader from '@/components/text-split/FileUploader';
import FileList from '@/components/text-split/components/FileList';
import DeleteConfirmDialog from '@/components/text-split/components/DeleteConfirmDialog';
import LoadingBackdrop from '@/components/text-split/LoadingBackdrop';
import PdfSettings from '@/components/text-split/PdfSettings';
import ChunkList from '@/components/text-split/ChunkList';
import DomainAnalysis from '@/components/text-split/DomainAnalysis';
import ParticleBackground from '@/components/home/ParticleBackground';
import useTaskSettings from '@/hooks/useTaskSettings';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import useChunks from './useChunks';
import useQuestionGeneration from './useQuestionGeneration';
import useDataCleaning from './useDataCleaning';
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
  const [searchFileName, setSearchFileName] = useState('');

  // 上传区域的展开/折叠状态
  const [uploaderExpanded, setUploaderExpanded] = useState(true);

  // 文献列表(FileList)展示对话框状态
  const [fileListDialogOpen, setFileListDialogOpen] = useState(false);

  // 使用自定义hooks
  const { chunks, tocData, loading, fetchChunks, handleDeleteChunk, handleEditChunk, updateChunks, setLoading } =
    useChunks(projectId, questionFilter);

  // 获取文件列表
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

  const {
    processing: dataCleaningProcessing,
    progress: dataCleaningProgress,
    handleDataCleaning
  } = useDataCleaning(projectId, taskSettings);

  const { fileProcessing, progress: pdfProgress, handleFileProcessing } = useFileProcessing(projectId);

  // 当前页面使用的进度状态
  const progress = processing ? questionProgress : dataCleaningProcessing ? dataCleaningProgress : pdfProgress;

  // 加载文本块数据和文件列表
  useEffect(() => {
    fetchChunks('all');
    fetchUploadedFiles();
  }, [fetchChunks, taskFileProcessing, currentPage, searchFileName]);

  // 更新文件列表数据
  useEffect(() => {
    fetchUploadedFiles();
  }, [currentPage, searchFileName]);

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

  // 包装数据清洗的处理函数
  const onDataCleaning = async chunkIds => {
    await handleDataCleaning(chunkIds, selectedModelInfo, fetchChunks);
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

  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <main style={{ 
      overflow: 'hidden', 
      position: 'relative', 
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* Hero Section - 紧凑设计，参考首页 */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 6, md: 8 },
          pb: { xs: 4, md: 6 },
          overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.1) 0%, transparent 50%), #0A0E27'
            : 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.05) 0%, transparent 50%), #FAFBFC'
        }}
      >
        {/* 科技风格网格背景 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isDark
              ? `linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            opacity: 0.4,
            zIndex: 0
          }}
        />

        {/* 动态光效圆圈 */}
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          sx={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            top: '-200px',
            right: '-150px',
            zIndex: 0,
            filter: 'blur(60px)'
          }}
        />

        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -80, 0],
            y: [0, -40, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          sx={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            bottom: '-150px',
            left: '-100px',
            zIndex: 0,
            filter: 'blur(60px)'
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2
            }}
          >
            <TextFieldsIcon
              sx={{
                fontSize: { xs: 32, md: 40 },
                mr: 2,
                color: theme.palette.primary.main,
                filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}40)`
              }}
            />
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                background: theme.palette.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('textSplit.title')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 内容区域 */}
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: -4, md: -6 },
          mb: { xs: 4, md: 6 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* 统计信息卡片 - 参考首页StatsCard紧凑设计 */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {[
                {
                  value: uploadedFiles.total || 0,
                  label: t('textSplit.stats.files'),
                  color: 'primary',
                  icon: <CloudUploadIcon />,
                  gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                },
                {
                  value: chunks.length || 0,
                  label: t('textSplit.stats.chunks'),
                  color: 'secondary',
                  icon: <DescriptionIcon />,
                  gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
                },
                {
                  value: chunks.filter(c => c.Questions && c.Questions.length > 0).length || 0,
                  label: t('textSplit.stats.processed'),
                  color: 'success',
                  icon: <AutoAwesomeIcon />,
                  gradient: 'linear-gradient(135deg, #22C55E 0%, #059669 100%)'
                },
                {
                  value: chunks.reduce((sum, c) => sum + (c.size || 0), 0).toLocaleString(),
                  label: t('textSplit.stats.totalWords'),
                  color: 'warning',
                  icon: <AnalyticsIcon />,
                  gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                }
              ].map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper
                    component={motion.div}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: '20px',
                      background: isDark
                        ? 'rgba(15, 23, 42, 0.8)'
                        : '#FFFFFF',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isDark
                        ? '1px solid rgba(99, 102, 241, 0.2)'
                        : '1px solid rgba(226, 232, 240, 1)',
                      boxShadow: isDark
                        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                        : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: item.gradient,
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      },
                      '&:hover': {
                        borderColor: isDark
                          ? `rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.4)`
                          : `rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.3)`,
                        boxShadow: isDark
                          ? `0 16px 48px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.3), 0 0 0 1px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.2)`
                          : `0 12px 40px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.15), 0 0 0 1px rgba(${index === 0 ? '99, 102, 241' : index === 1 ? '6, 182, 212' : index === 2 ? '34, 197, 94' : '245, 158, 11'}, 0.2)`,
                        '&::before': {
                          opacity: 1
                        }
                      }
                    }}
                  >
                    {/* 背景装饰 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: item.gradient,
                        opacity: isDark ? 0.1 : 0.05,
                        filter: 'blur(40px)',
                        zIndex: 0
                      }}
                    />

                    <Box
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}
                    >
                      {/* 图标容器 */}
                      <Box
                        sx={{
                          width: { xs: 64, md: 72 },
                          height: { xs: 64, md: 72 },
                          borderRadius: '16px',
                          background: item.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3,
                          boxShadow: `0 8px 24px ${theme.palette[item.color].main}40`,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: -2,
                            borderRadius: '18px',
                            background: item.gradient,
                            opacity: 0.3,
                            filter: 'blur(8px)',
                            zIndex: -1
                          }
                        }}
                      >
                        <Box sx={{ color: '#FFFFFF', fontSize: { xs: '28px', md: '32px' } }}>
                          {item.icon}
                        </Box>
                      </Box>

                      {/* 数字 */}
                      <Typography
                        variant={isMobile ? 'h3' : 'h2'}
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          background: item.gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontSize: { xs: '2rem', md: '2.5rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {item.value}
                      </Typography>

                      {/* 标签 */}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          opacity: 0.9
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* 文件上传组件 - 紧凑设计 */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: '20px',
              background: isDark
                ? 'rgba(15, 23, 42, 0.8)'
                : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 顶部操作栏 - 紧凑设计 */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                borderBottom: isDark
                  ? '1px solid rgba(99, 102, 241, 0.1)'
                  : '1px solid rgba(226, 232, 240, 1)',
                background: isDark
                  ? 'rgba(99, 102, 241, 0.05)'
                  : 'rgba(99, 102, 241, 0.02)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon sx={{ color: theme.palette.primary.main, fontSize: '20px' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, background: theme.palette.gradient.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('textSplit.uploadNewDocument')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  onClick={() => setUploaderExpanded(!uploaderExpanded)}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(99, 102, 241, 0.08)',
                    border: isDark
                      ? '1px solid rgba(99, 102, 241, 0.2)'
                      : '1px solid rgba(99, 102, 241, 0.15)',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(99, 102, 241, 0.12)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {uploaderExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                {uploaderExpanded && (
                  <IconButton
                    onClick={() => setFileListDialogOpen(true)}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(99, 102, 241, 0.08)',
                      border: isDark
                        ? '1px solid rgba(99, 102, 241, 0.2)'
                        : '1px solid rgba(99, 102, 241, 0.15)',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(99, 102, 241, 0.12)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    title={t('textSplit.fileList')}
                  >
                    <FullscreenIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            <Collapse in={uploaderExpanded}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
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
              </Box>
            </Collapse>
          </Paper>

          {/* 标签页 - 紧凑设计 */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              background: isDark
                ? 'rgba(15, 23, 42, 0.8)'
                : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden'
            }}
          >
            {/* 顶部标签栏 - 紧凑设计 */}
            <Box
              sx={{
                p: 1,
                borderBottom: isDark
                  ? '1px solid rgba(99, 102, 241, 0.1)'
                  : '1px solid rgba(226, 232, 240, 1)',
                background: isDark
                  ? 'rgba(99, 102, 241, 0.05)'
                  : 'rgba(99, 102, 241, 0.02)'
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(event, newValue) => {
                  setActiveTab(newValue);
                }}
                variant="fullWidth"
                sx={{
                  minHeight: 44,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    minHeight: 40,
                    transition: 'all 0.3s ease',
                    mx: 0.5,
                    '&.Mui-selected': {
                      color: '#FFFFFF',
                      background: theme.palette.gradient.primary,
                      backgroundColor: theme.palette.primary.main,
                      boxShadow: isDark
                        ? '0 4px 16px rgba(99, 102, 241, 0.4)'
                        : '0 4px 16px rgba(99, 102, 241, 0.3)'
                    },
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
                    }
                  }
                }}
              >
                <Tab label={t('textSplit.tabs.smartSplit')} />
                <Tab label={t('textSplit.tabs.domainAnalysis')} />
              </Tabs>
            </Box>

            {/* 标签内容区域 */}
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {activeTab === 0 && (
                <ChunkList
                  projectId={projectId}
                  chunks={chunks}
                  onDelete={handleDeleteChunk}
                  onEdit={handleEditChunk}
                  onGenerateQuestions={onGenerateQuestions}
                  onDataCleaning={onDataCleaning}
                  loading={loading}
                  questionFilter={questionFilter}
                  setQuestionFilter={setQuestionFilter}
                  selectedModel={selectedModelInfo}
                />
              )}

              {activeTab === 1 && <DomainAnalysis projectId={projectId} toc={tocData} loading={loading} />}
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* 加载中蒙版 */}
      <LoadingBackdrop open={loading} title={t('textSplit.loading')} description={t('textSplit.fetchingDocuments')} />

      {/* 处理中蒙版 */}
      <LoadingBackdrop open={processing} title={t('textSplit.processing')} progress={progress} />

      {/* 数据清洗进度蒙版 */}
      <LoadingBackdrop open={dataCleaningProcessing} title={t('textSplit.dataCleaning')} progress={progress} />

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
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: isDark
              ? 'rgba(15, 23, 42, 0.95)'
              : '#FFFFFF',
            backdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(99, 102, 241, 0.2)'
              : '1px solid rgba(226, 232, 240, 1)',
            boxShadow: isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 4px 24px rgba(15, 23, 42, 0.08)'
          }
        }}
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
              isFullscreen={true} // 在对话框中移除高度限制
            />
          </Box>
        </DialogContent>
      </Dialog>
    </main>
  );
}
