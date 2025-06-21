'use client';

import { Box, Typography, Checkbox, Button, Select, MenuItem, Tooltip } from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ChunkListHeader({
  projectId,
  totalChunks,
  selectedChunks,
  onSelectAll,
  onBatchGenerateQuestions,
  onBatchEditChunks,
  questionFilter,
  setQuestionFilter,
  chunks = [], // 添加chunks参数，用于导出文本块
  selectedModel = {}
}) {
  const { t, i18n } = useTranslation();

  // 创建自动提取问题任务
  const handleCreateAutoQuestionTask = async () => {
    if (!projectId || !selectedModel?.id) {
      toast.error(t('textSplit.selectModelFirst', { defaultValue: '请先选择模型' }));
      return;
    }

    try {
      // 调用创建任务接口
      const response = await axios.post(`/api/projects/${projectId}/tasks/list`, {
        taskType: 'question-generation',
        modelInfo: selectedModel,
        language: i18n.language,
        detail: '批量生成问题任务'
      });

      if (response.data?.code === 0) {
        toast.success(t('tasks.createSuccess', { defaultValue: '后台任务已创建，系统将自动处理未生成问题的文本块' }));
      } else {
        toast.error(t('tasks.createFailed', { defaultValue: '创建任务失败' }) + ': ' + response.data?.message);
      }
    } catch (error) {
      console.error('创建自动提取问题任务失败:', error);
      toast.error(t('tasks.createFailed', { defaultValue: '创建任务失败' }) + ': ' + error.message);
    }
  };

  // 导出文本块为JSON文件的函数
  const handleExportChunks = () => {
    if (!chunks || chunks.length === 0) return;

    // 创建要导出的数据对象
    const exportData = chunks.map(chunk => ({
      name: chunk.name,
      projectId: chunk.projectId,
      fileName: chunk.fileName,
      content: chunk.content,
      summary: chunk.summary,
      size: chunk.size
    }));

    // 将数据转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);

    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-chunks-export-${new Date().toISOString().split('T')[0]}.json`;

    // 触发下载
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '30px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Checkbox
          checked={selectedChunks.length === totalChunks}
          indeterminate={selectedChunks.length > 0 && selectedChunks.length < totalChunks}
          onChange={onSelectAll}
        />
        <Typography variant="body1">
          {t('textSplit.selectedCount', { count: selectedChunks.length })} ,
          {t('textSplit.totalCount', { count: totalChunks })}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Select value={questionFilter} onChange={setQuestionFilter} size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="all">{t('textSplit.allChunks')}</MenuItem>
          <MenuItem value="generated">{t('textSplit.generatedQuestions2')}</MenuItem>
          <MenuItem value="ungenerated">{t('textSplit.ungeneratedQuestions')}</MenuItem>
        </Select>

        <Tooltip title={t('batchEdit.batchEditTooltip', { defaultValue: '批量编辑选中的文本块' })}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AutoFixHighIcon />}
            disabled={selectedChunks.length === 0}
            onClick={onBatchEditChunks}
            sx={{ mr: 1 }}
          >
            {t('batchEdit.batchEdit', { defaultValue: '批量编辑' })}
          </Button>
        </Tooltip>

        <Button
          variant="contained"
          color="primary"
          startIcon={<QuizIcon />}
          disabled={selectedChunks.length === 0}
          onClick={onBatchGenerateQuestions}
          sx={{ mr: 1 }}
        >
          {t('textSplit.batchGenerateQuestions')}
        </Button>

        <Tooltip
          title={t('textSplit.autoGenerateQuestionsTip', {
            defaultValue: '创建后台批量处理任务：自动查询待生成问题的文本块并提取问题'
          })}
        >
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AutoFixHighIcon />}
            onClick={() => handleCreateAutoQuestionTask()}
            disabled={!projectId || !selectedModel?.id}
            sx={{ mr: 1 }}
          >
            {t('textSplit.autoGenerateQuestions')}
          </Button>
        </Tooltip>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          disabled={chunks.length === 0}
          onClick={handleExportChunks}
        >
          {t('textSplit.exportChunks', { defaultValue: '导出文本块' })}
        </Button>
      </Box>
    </Box>
  );
}
