'use client';

import { Box, Typography, Checkbox, Button, Select, MenuItem } from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';

export default function ChunkListHeader({
  totalChunks,
  selectedChunks,
  onSelectAll,
  onBatchGenerateQuestions,
  questionFilter,
  setQuestionFilter,
  chunks = [] // 添加chunks参数，用于导出文本块
}) {
  const { t } = useTranslation();

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
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
