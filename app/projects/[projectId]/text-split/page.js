'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  Backdrop,
  Paper,
  LinearProgress,
  Select,
  MenuItem
} from '@mui/material';
import FileUploader from '@/components/text-split/FileUploader';
import ChunkList from '@/components/text-split/ChunkList';
import DomainAnalysis from '@/components/text-split/DomainAnalysis';
import request from '@/lib/util/request';
import { processInParallel } from '@/lib/util/async';
import useTaskSettings from '@/hooks/useTaskSettings';
import { useAtomValue, useSetAtom } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import axios from 'axios';

export default function TextSplitPage({ params }) {
  const { t } = useTranslation();
  const { projectId } = params;
  const [activeTab, setActiveTab] = useState(0);
  const [chunks, setChunks] = useState([]);
  const [tocData, setTocData] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [error, setError] = useState(null); // 可以是字符串或对象 { severity, message }
  const { taskSettings } = useTaskSettings(projectId);
  const [pdfStrategy, setPdfStrategy] = useState('default');
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all', 'generated', 'ungenerated'
  const [selectedViosnModel, setSelectedViosnModel] = useState('');
  let selectedModelInfo = useAtomValue(selectedModelInfoAtom);
  // 进度状态
  const [progress, setProgress] = useState({
    total: 0, // 总共选择的文本块数量
    completed: 0, // 已处理完成的数量
    percentage: 0, // 进度百分比
    questionCount: 0 // 已生成的问题数量
  });

  const [pageProfress, setPageProfress] = useState({
    strategy: 'default',
    taskStatus: 'pending',
    fileIndex: 1,
    total: 0,
    completed: 0,
    percentage: 0
  });

  // 加载文本块数据
  useEffect(() => {
    fetchChunks();
  }, []);

  // 获取文本块列表
  const fetchChunks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/split?filter=${questionFilter}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.fetchChunksFailed'));
      }

      const data = await response.json();
      setChunks(data.chunks || []);

      // 如果有文件结果，处理详细信息
      if (data.toc) {
        console.log(t('textSplit.fileResultReceived'), data.fileResult);
        // 如果有目录结构，设置目录数据
        setTocData(data.toc);
      }
    } catch (error) {
      console.error(t('textSplit.fetchChunksError'), error);
      setError({ severity: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 处理文件上传成功
  const handleUploadSuccess = async (fileNames, pdfFiles, domainTreeAction) => {
    console.log(t('textSplit.fileUploadSuccess'), fileNames);
    //上传完处理PDF文件
    try {
      setPdfProcessing(true);
      setError(null);
      // 重置进度：基于新上传的文件数量
      setProgress({
        total: pdfFiles.length, // 关键修正：使用过滤后的总数
        completed: 0,
        percentage: 0,
        questionCount: 0
      });

      const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';
      let fileIndex = 1;
      for (const file of pdfFiles) {
        // 关键修正：遍历过滤后的列表
        const response = await fetch(
          `/api/projects/${projectId}/pdf?fileName=${encodeURIComponent(file.name)}&strategy=${pdfStrategy}&currentLanguage=${currentLanguage}&modelId=${selectedViosnModel}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(t('textSplit.pdfProcessingFailed') + errorData.error);
        }
        const data = await response.json();
        const taskId = data.result;
        //定时器，循环查询任务状态
        await new Promise(resolve => {
          const interval = setInterval(async () => {
            //查询进度信息
            const taskResponse = await fetch(`/api/task/${taskId}`);
            if (!taskResponse.ok) {
              const errorData = await taskResponse.json();
              clearInterval(interval);
              resolve();
              throw new Error(t('textSplit.pdfProcessingFailed') + errorData.error);
            }
            const taskData = await taskResponse.json();
            //有时候启动任务了，但是等到任务更新进度，就开始查询会导致message为空
            if (taskData.message) {
              const message = JSON.parse(taskData.message);
              // 设置页面进度信息
              setPageProfress({
                strategy: message.strategy || 'default',
                taskStatus: message.taskStatus,
                fileIndex: fileIndex,
                total: message.total,
                completed: message.current,
                percentage: parseInt(taskData.progress)
              });
            }
            //completed标志任务完成
            if (taskData.status === 'completed') {
              clearInterval(interval);
              resolve();
            } else if (taskData.status === 'failed') {
              //failed处理失败，终止当前定时器
              console.error(t('textSplit.pdfProcessingFailed'), taskData.error);
              setError({ severity: 'error', message: taskData.error });
              clearInterval(interval);
              resolve();
            }
          }, 1000);
        });
        // 更新进度状态
        setProgress(prev => {
          const completed = prev.completed + 1;
          const percentage = Math.round((completed / prev.total) * 100);
          return {
            ...prev,
            completed,
            percentage
          };
        });
        //重置页面处理进度
        setPageProfress({
          fileIndex: fileIndex++,
          strategy: 'default',
          taskStatus: 'pending',
          total: 0,
          completed: 0,
          percentage: 0
        });
      }
    } catch (error) {
      console.error(t('textSplit.pdfProcessingFailed'), error);
      setError({ severity: 'error', message: error.message });
    } finally {
      setPdfProcessing(false);
      // 重置进度状态
      setTimeout(() => {
        setProgress({
          total: 0,
          completed: 0,
          percentage: 0,
          questionCount: 0
        });
      }, 1000); // 延迟重置，让用户看到完成的进度
    }

    // 如果有文件上传成功，自动处理第一个文件
    if (fileNames && fileNames.length > 0) {
      handleSplitText(fileNames, domainTreeAction);
    }
  };

  // 处理文本分割
  const handleSplitText = async (fileNames, domainTreeAction = 'rebuild') => {
    try {
      setProcessing(true);
      const language = i18n.language === 'zh-CN' ? '中文' : 'en';
      const response = await fetch(`/api/projects/${projectId}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileNames, model: selectedModelInfo, language, domainTreeAction })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.splitTextFailed'));
      }

      const data = await response.json();

      // 更新文本块列表
      setChunks(prev => {
        const newChunks = [...prev];
        data.chunks.forEach(chunk => {
          if (!newChunks.find(c => c.id === chunk.id)) {
            newChunks.push(chunk);
          }
        });
        return newChunks;
      });

      // 更新目录结构
      if (data.toc) {
        setTocData(data.toc);
      }

      // 自动切换到智能分割标签
      setActiveTab(0);
      // 替换location.reload()为状态更新和数据获取
      fetchChunks();
    } catch (error) {
      console.error(t('textSplit.splitTextError'), error);
      setError({ severity: 'error', message: error.message });
    } finally {
      setProcessing(false);
    }
  };

  // 处理删除文本块
  const handleDeleteChunk = async chunkId => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.deleteChunkFailed'));
      }

      // 更新文本块列表
      setChunks(prev => prev.filter(chunk => chunk.id !== chunkId));
    } catch (error) {
      console.error(t('textSplit.deleteChunkError'), error);
      setError({ severity: 'error', message: error.message });
    }
  };

  // 处理生成问题
  const handleGenerateQuestions = async chunkIds => {
    try {
      setProcessing(true);
      setError(null);

      // 重置进度状态
      setProgress({
        total: chunkIds.length,
        completed: 0,
        percentage: 0,
        questionCount: 0
      });

      let model = selectedModelInfo;

      // 如果仍然没有模型信息，抛出错误
      if (!model) {
        throw new Error(t('textSplit.selectModelFirst'));
      }

      // 如果是单个文本块，直接调用单个生成接口
      if (chunkIds.length === 1) {
        const chunkId = chunkIds[0];
        // 获取当前语言环境
        const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

        const response = await request(`/api/projects/${projectId}/chunks/${chunkId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model, language: currentLanguage })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('textSplit.generateQuestionsFailed', { chunkId }));
        }

        const data = await response.json();
        console.log(t('textSplit.questionsGenerated', { chunkId, total: data.total }));
        setError({
          severity: 'success',
          message: t('textSplit.questionsGeneratedSuccess', {
            total: data.total
          })
        });
      } else {
        // 如果是多个文本块，循环调用单个文本块的问题生成接口，限制并行数为2
        let totalQuestions = 0;
        let successCount = 0;
        let errorCount = 0;

        // 单个文本块处理函数
        const processChunk = async chunkId => {
          try {
            // 获取当前语言环境
            const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

            const response = await request(
              `/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}/questions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model, language: currentLanguage })
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.error(t('textSplit.generateQuestionsForChunkFailed', { chunkId }), errorData.error);
              errorCount++;
              return { success: false, chunkId, error: errorData.error };
            }

            const data = await response.json();
            console.log(t('textSplit.questionsGenerated', { chunkId, total: data.total }));

            // 更新进度状态
            setProgress(prev => {
              const completed = prev.completed + 1;
              const percentage = Math.round((completed / prev.total) * 100);
              const questionCount = prev.questionCount + (data.total || 0);

              return {
                ...prev,
                completed,
                percentage,
                questionCount
              };
            });

            totalQuestions += data.total || 0;
            successCount++;
            return { success: true, chunkId, total: data.total };
          } catch (error) {
            console.error(t('textSplit.generateQuestionsForChunkError', { chunkId }), error);
            errorCount++;

            // 更新进度状态（即使失败也计入已处理）
            setProgress(prev => {
              const completed = prev.completed + 1;
              const percentage = Math.round((completed / prev.total) * 100);

              return {
                ...prev,
                completed,
                percentage
              };
            });

            return { success: false, chunkId, error: error.message };
          }
        };

        // 并行处理所有文本块，最多同时处理2个
        await processInParallel(chunkIds, processChunk, taskSettings.concurrencyLimit);

        // 处理完成后设置结果消息
        if (errorCount > 0) {
          setError({
            severity: 'warning',
            message: t('textSplit.partialSuccess', {
              successCount,
              total: chunkIds.length,
              errorCount
            })
          });
        } else {
          setError({
            severity: 'success',
            message: t('textSplit.allSuccess', {
              successCount,
              totalQuestions
            })
          });
        }
      }

      // 刷新文本块列表
      fetchChunks();
    } catch (error) {
      console.error(t('textSplit.generateQuestionsError'), error);
      setError({ severity: 'error', message: error.message });
    } finally {
      setProcessing(false);
      // 重置进度状态
      setTimeout(() => {
        setProgress({
          total: 0,
          completed: 0,
          percentage: 0,
          questionCount: 0
        });
      }, 1000); // 延迟重置，让用户看到完成的进度
    }
  };

  // 处理文本块编辑
  const handleEditChunk = async (chunkId, newContent) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.editChunkFailed'));
      }

      // 更新成功后刷新文本块列表
      fetchChunks();

      setError({
        severity: 'success',
        message: t('textSplit.editChunkSuccess')
      });
    } catch (error) {
      console.error(t('textSplit.editChunkError'), error);
      setError({ severity: 'error', message: error.message });
    } finally {
      setProcessing(false);
    }
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
    if (!error) return null;

    const severity = error.severity || 'error';
    const message = typeof error === 'string' ? error : error.message;

    return (
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={2000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    );
  };

  // 处理筛选器变更
  useEffect(() => {
    fetchChunks();
  }, [questionFilter]);

  const handleSelected = array => {
    if (array.length > 0) {
      axios.post(`/api/projects/${projectId}/chunks`, { array }).then(response => {
        setChunks(response.data);
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
        setPdfStrategy={setPdfStrategy}
        setPageLoading={setLoading}
        pdfStrategy={pdfStrategy}
        selectedViosnModel={selectedViosnModel}
        setSelectedViosnModel={setSelectedViosnModel}
        sendToPages={handleSelected}
      />

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
            onGenerateQuestions={handleGenerateQuestions}
            loading={loading}
            questionFilter={questionFilter}
            setQuestionFilter={setQuestionFilter}
          />
        )}

        {/* 领域分析标签内容 */}
        {activeTab === 1 && <DomainAnalysis projectId={projectId} toc={tocData} loading={loading} />}
      </Box>

      {/* 加载中蒙版 */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          position: 'fixed',
          backdropFilter: 'blur(3px)'
        }}
        open={loading}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            minWidth: 200
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">{t('textSplit.loading')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('textSplit.fetchingDocuments')}
          </Typography>
        </Paper>
      </Backdrop>

      {/* 处理中蒙版 */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          position: 'fixed',
          backdropFilter: 'blur(3px)'
        }}
        open={processing}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            minWidth: 300
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">{t('textSplit.processing')}</Typography>

          {progress.total > 1 ? (
            <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('textSplit.progressStatus', {
                    total: progress.total,
                    completed: progress.completed
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.percentage}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress.percentage} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {t('textSplit.questionsGenerated', {
                  total: progress.questionCount
                })}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('textSplit.processingPleaseWait')}
            </Typography>
          )}
        </Paper>
      </Backdrop>

      {/* PDF处理中蒙版 */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          position: 'fixed',
          backdropFilter: 'blur(3px)'
        }}
        open={pdfProcessing}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            minWidth: 400
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">
            {t('textSplit.pdfProcessing')}({t(`textSplit.task.${pageProfress.taskStatus}`)})
          </Typography>
          {progress.total > 1 ? (
            <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('textSplit.pdfProcessStatus', {
                    total: progress.total,
                    completed: progress.completed
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.percentage}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress.percentage} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('textSplit.processingPleaseWait')}
            </Typography>
          )}
          {pageProfress.total > 1 ? (
            <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {progress.total > 1
                    ? t('textSplit.pdfPageProcessIndex', {
                        fileIndex: pageProfress.fileIndex
                      })
                    : ''}
                  {t('textSplit.pdfPageProcessStatus', {
                    total: pageProfress.total,
                    completed: pageProfress.completed
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pageProfress.percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pageProfress.percentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ) : (
            ''
          )}
        </Paper>
      </Backdrop>

      {/* 错误或成功提示 */}
      {renderAlert()}
    </Container>
  );
}
