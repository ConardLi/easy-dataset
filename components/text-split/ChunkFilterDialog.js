'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  Slider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createDefaultChunkFilters,
  getChunkFilterSliderMax,
  toAppliedChunkFilters,
  toChunkFilterDialogState
} from './chunkFilters.mjs';

export default function ChunkFilterDialog({ open, onClose, onApply, initialFilters = {}, maxChunkSize = 0 }) {
  const { t } = useTranslation();
  const nextSliderMax = getChunkFilterSliderMax(maxChunkSize, initialFilters);
  const [sliderMax, setSliderMax] = useState(nextSliderMax);
  const initialDialogState = toChunkFilterDialogState(initialFilters, sliderMax);
  const [contentKeyword, setContentKeyword] = useState(initialDialogState.contentKeyword);
  const [sizeRange, setSizeRange] = useState(initialDialogState.sizeRange);
  const [hasQuestions, setHasQuestions] = useState(initialDialogState.hasQuestions);
  const [maxSizeUnbounded, setMaxSizeUnbounded] = useState(initialFilters.sizeRange?.[1] == null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      const dialogState = toChunkFilterDialogState(initialFilters, nextSliderMax);
      setSliderMax(nextSliderMax);
      setContentKeyword(dialogState.contentKeyword);
      setSizeRange(dialogState.sizeRange);
      setHasQuestions(dialogState.hasQuestions);
      setMaxSizeUnbounded(initialFilters.sizeRange?.[1] == null);
    }

    wasOpen.current = open;
  }, [open, initialFilters, nextSliderMax]);

  // 重置筛选条件
  const handleReset = () => {
    const resetState = toChunkFilterDialogState(createDefaultChunkFilters(), sliderMax);
    setContentKeyword(resetState.contentKeyword);
    setSizeRange(resetState.sizeRange);
    setHasQuestions(resetState.hasQuestions);
    setMaxSizeUnbounded(true);
  };

  // 应用筛选
  const handleApply = () => {
    onApply(toAppliedChunkFilters({ contentKeyword, sizeRange, hasQuestions }, sliderMax, maxSizeUnbounded));
    onClose();
  };

  // 处理大小范围变化
  const handleSizeRangeChange = (event, newValue, activeThumb) => {
    setSizeRange(newValue);
    if (activeThumb === 1) {
      setMaxSizeUnbounded(newValue[1] >= sliderMax);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('datasets.moreFilters', { defaultValue: '更多筛选' })}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
        {/* 文本块内容筛选 */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('textSplit.contentKeyword', { defaultValue: '文本块内容' })}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={t('textSplit.contentKeywordPlaceholder', { defaultValue: '输入关键词搜索文本块内容' })}
            value={contentKeyword}
            onChange={e => setContentKeyword(e.target.value)}
            variant="outlined"
          />
        </Box>

        {/* 字数范围筛选 */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('textSplit.characterRange', { defaultValue: '字数范围' })}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {sizeRange[0]} - {sizeRange[1]}
            </Typography>
          </Box>
          <Slider
            value={sizeRange}
            onChange={handleSizeRangeChange}
            valueLabelDisplay="auto"
            min={0}
            max={sliderMax}
            step={sliderMax > 100 ? 100 : 1}
            marks={[
              { value: 0, label: '0' },
              { value: sliderMax, label: String(sliderMax) }
            ]}
          />
        </Box>

        {/* 是否有问题的筛选 */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('textSplit.questionStatus', { defaultValue: '问题状态' })}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={hasQuestions === null} onChange={() => setHasQuestions(null)} />}
              label={t('textSplit.allChunks', { defaultValue: '全部' })}
            />
            <FormControlLabel
              control={<Checkbox checked={hasQuestions === true} onChange={() => setHasQuestions(true)} />}
              label={t('textSplit.generatedQuestions2', { defaultValue: '已生成问题' })}
            />
            <FormControlLabel
              control={<Checkbox checked={hasQuestions === false} onChange={() => setHasQuestions(false)} />}
              label={t('textSplit.ungeneratedQuestions', { defaultValue: '未生成问题' })}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleReset} color="inherit">
          {t('common.reset', { defaultValue: '重置' })}
        </Button>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel', { defaultValue: '取消' })}
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          {t('common.apply', { defaultValue: '应用' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
