'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Divider
} from '@mui/material';

/**
 * 全自动蒸馏数据集配置弹框
 * @param {Object} props
 * @param {boolean} props.open - 对话框是否打开
 * @param {Function} props.onClose - 关闭对话框的回调
 * @param {Function} props.onStart - 开始蒸馏任务的回调
 * @param {string} props.projectId - 项目ID
 * @param {Object} props.project - 项目信息
 * @param {Object} props.stats - 当前统计信息
 */
export default function AutoDistillDialog({ open, onClose, onStart, projectId, project, stats = {} }) {
  const { t } = useTranslation();

  // 表单状态
  const [topic, setTopic] = useState('');
  const [levels, setLevels] = useState(2);
  const [tagsPerLevel, setTagsPerLevel] = useState(10);
  const [questionsPerTag, setQuestionsPerTag] = useState(10);

  // 计算信息
  const [estimatedTags, setEstimatedTags] = useState(0); // 所有标签总数（包括根节点和中间节点）
  const [leafTags, setLeafTags] = useState(0); // 叶子节点数量（即最后一层标签数）
  const [estimatedQuestions, setEstimatedQuestions] = useState(0);
  const [newTags, setNewTags] = useState(0);
  const [newQuestions, setNewQuestions] = useState(0);
  const [error, setError] = useState('');

  // 初始化默认主题
  useEffect(() => {
    if (project && project.name) {
      setTopic(project.name);
    }
  }, [project]);

  // 计算预估标签和问题数量
  useEffect(() => {
    /*
     * 根据公式：总问题数 = \left( \prod_{i=1}^{n} L_i \right) \times Q
     * 当每层标签数量相同(L)时：总问题数 = L^n \times Q
     */

    const leafTags = Math.pow(tagsPerLevel, levels);

    // 总问题数 = 叶子节点数 * 每个节点的问题数
    const totalQuestions = leafTags * questionsPerTag;

    let totalTags;
    if (tagsPerLevel === 1) {
      // 如果每层只有1个标签，总数就是 levels+1
      totalTags = levels + 1;
    } else {
      // 使用等比数列求和公式
      totalTags = (1 - Math.pow(tagsPerLevel, levels + 1)) / (1 - tagsPerLevel);
    }

    setLeafTags(leafTags);
    setEstimatedTags(leafTags); // 改为只显示叶子节点数量，而非所有节点数量
    setEstimatedQuestions(totalQuestions);

    // 计算新增标签和问题数量
    const currentTags = stats.tagsCount || 0;
    const currentQuestions = stats.questionsCount || 0;

    // 只考虑最后一层的标签数量
    setNewTags(Math.max(0, leafTags - currentTags));
    setNewQuestions(Math.max(0, totalQuestions - currentQuestions));

    // 验证是否可以执行任务
    if (leafTags <= currentTags && totalQuestions <= currentQuestions) {
      setError(t('distill.autoDistillInsufficientError'));
    } else {
      setError('');
    }
  }, [levels, tagsPerLevel, questionsPerTag, stats, t]);

  // 处理开始任务
  const handleStart = () => {
    if (error) return;

    onStart({
      topic,
      levels,
      tagsPerLevel,
      questionsPerTag,
      estimatedTags,
      estimatedQuestions
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('distill.autoDistillTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* 左侧：输入区域 */}
          <Box sx={{ flex: 1 }}>
            <TextField
              label={t('distill.distillTopic')}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled
              helperText={t('distill.rootTopicHelperText')}
            />

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography gutterBottom>{t('distill.tagLevels')}</Typography>
              <TextField
                type="number"
                fullWidth
                InputProps={{
                  inputProps: { min: 1, max: 5 }
                }}
                value={levels}
                onChange={e => {
                  const value = Math.min(5, Math.max(1, Number(e.target.value)));
                  setLevels(value);
                }}
                helperText={t('distill.tagLevelsHelper', { max: 5 })}
              />
            </Box>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography gutterBottom>{t('distill.tagsPerLevel')}</Typography>
              <TextField
                type="number"
                fullWidth
                InputProps={{
                  inputProps: { min: 1, max: 50 }
                }}
                value={tagsPerLevel}
                onChange={e => {
                  const value = Math.min(50, Math.max(1, Number(e.target.value)));
                  setTagsPerLevel(value);
                }}
                helperText={t('distill.tagsPerLevelHelper', { max: 50 })}
              />
            </Box>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography gutterBottom>{t('distill.questionsPerTag')}</Typography>
              <TextField
                type="number"
                fullWidth
                InputProps={{
                  inputProps: { min: 1, max: 50 }
                }}
                value={questionsPerTag}
                onChange={e => {
                  const value = Math.min(50, Math.max(1, Number(e.target.value)));
                  setQuestionsPerTag(value);
                }}
                helperText={t('distill.questionsPerTagHelper', { max: 50 })}
              />
            </Box>
          </Box>

          {/* 右侧：预估信息区域 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mt: 1,
                borderRadius: 2,
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {t('distill.estimationInfo')}
              </Typography>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
                    <Typography variant="subtitle2">{t('distill.estimatedTags')}:</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {estimatedTags}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">{t('distill.estimatedQuestions')}:</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {estimatedQuestions}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">{t('distill.currentTags')}:</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {stats.tagsCount || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">{t('distill.currentQuestions')}:</Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {stats.questionsCount || 0}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" color="primary">
                      {t('distill.newTags')}:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {newTags}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" color="primary">
                      {t('distill.newQuestions')}:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {newQuestions}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleStart} color="primary" variant="contained" disabled={!!error || !topic}>
          {t('distill.startAutoDistill')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
