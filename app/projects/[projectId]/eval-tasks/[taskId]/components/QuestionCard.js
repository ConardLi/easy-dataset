'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Chip, Paper, Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { detailStyles } from '../detailStyles';
import { useTranslation } from 'react-i18next';
import 'github-markdown-css/github-markdown-light.css';

// 答题状态常量
const EVAL_STATUS = {
  SUCCESS: 0,
  FORMAT_ERROR: 1,
  API_ERROR: 2
};

// 状态标签配置
const STATUS_CONFIG = {
  [EVAL_STATUS.SUCCESS]: { label: 'evalTasks.statusSuccess', color: 'success' },
  [EVAL_STATUS.FORMAT_ERROR]: { label: 'evalTasks.statusFormatError', color: 'warning' },
  [EVAL_STATUS.API_ERROR]: { label: 'evalTasks.statusApiError', color: 'error' }
};

export default function QuestionCard({ result, index, task }) {
  const { t } = useTranslation();
  const {
    evalDataset,
    modelAnswer,
    isCorrect,
    score,
    judgeResponse,
    duration = 0,
    status = 0,
    errorMessage = ''
  } = result;
  const { question, questionType, options, correctAnswer } = evalDataset;

  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowExpand, setShouldShowExpand] = useState(false);
  const contentRef = useRef(null);

  const [isCorrectExpanded, setIsCorrectExpanded] = useState(false);
  const [shouldShowCorrectExpand, setShouldShowCorrectExpand] = useState(false);
  const correctContentRef = useRef(null);

  // 检查内容是否超过高度限制
  useEffect(() => {
    if (contentRef.current) {
      const hasOverflow = contentRef.current.scrollHeight > 200;
      setShouldShowExpand(hasOverflow);
    }
  }, [modelAnswer]);

  useEffect(() => {
    if (correctContentRef.current) {
      const hasOverflow = correctContentRef.current.scrollHeight > 200;
      setShouldShowCorrectExpand(hasOverflow);
    }
  }, [correctAnswer]);

  // 解析选项
  let parsedOptions = [];
  if (questionType === 'single_choice' || questionType === 'multiple_choice') {
    try {
      parsedOptions = JSON.parse(options);
    } catch (e) {
      parsedOptions = options ? [options] : [];
    }
  } else if (questionType === 'true_false') {
    parsedOptions = ['True', 'False'];
  }

  // 格式化答案显示
  const formatAnswer = ans => {
    if (!ans) return '-';
    return String(ans);
  };

  // 判断选项状态
  const getOptionStatus = (optionText, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const normModelAns = String(modelAnswer).trim();
    const normCorrectAns = String(correctAnswer).trim();

    let isSelected = false;
    let isCorrectOption = false;

    if (questionType === 'true_false') {
      // 判断题：A 对应 ✅/True，B 对应 ❌/False
      const isTrueOption = idx === 0;
      const isFalseOption = idx === 1;

      isSelected =
        (isTrueOption && (normModelAns === '✅' || normModelAns.toUpperCase() === 'TRUE')) ||
        (isFalseOption && (normModelAns === '❌' || normModelAns.toUpperCase() === 'FALSE'));

      isCorrectOption =
        (isTrueOption && (normCorrectAns === '✅' || normCorrectAns.toUpperCase() === 'TRUE')) ||
        (isFalseOption && (normCorrectAns === '❌' || normCorrectAns.toUpperCase() === 'FALSE'));
    } else {
      // 选择题逻辑
      const normModelAnsUpper = normModelAns.toUpperCase();
      const normCorrectAnsUpper = normCorrectAns.toUpperCase();
      const normOptionText = String(optionText).toUpperCase();

      isSelected = normModelAnsUpper.includes(letter) || normModelAnsUpper.includes(normOptionText);
      isCorrectOption = normCorrectAnsUpper.includes(letter) || normCorrectAnsUpper.includes(normOptionText);
    }

    return { isSelected, isCorrectOption };
  };

  // 解析 AI 点评内容
  const getJudgeDisplayContent = content => {
    if (!content) return '';
    try {
      // 尝试从 markdown 代码块中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.reason) return parsed.reason;
      }
      // 尝试直接解析
      const parsed = JSON.parse(content);
      if (parsed.reason) return parsed.reason;
    } catch (e) {
      // 解析失败，返回原内容
    }
    return content;
  };

  return (
    <Box sx={detailStyles.questionCard(isCorrect)}>
      {/* 判卷标记 (红勾/红叉) - 绝对定位 */}
      <Box sx={detailStyles.markIcon(isCorrect)}>
        {isCorrect ? <CheckIcon fontSize="inherit" /> : <CloseIcon fontSize="inherit" />}
      </Box>

      {/* 题号与类型标签 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
        <Box
          sx={{
            ...detailStyles.questionIndex,
            position: 'relative', // 改为相对定位
            top: 'auto',
            left: 'auto',
            flexShrink: 0
          }}
        >
          {index + 1}
        </Box>
        <Chip
          label={t(`eval.questionTypes.${questionType}`)}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ borderRadius: 1 }}
        />

        {/* 答题耗时 */}
        {duration > 0 && (
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
            label={duration >= 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`}
            size="small"
            variant="outlined"
            sx={{ height: 24, '& .MuiChip-label': { px: 0.75, fontSize: '0.75rem' } }}
          />
        )}

        {/* 答题状态 */}
        {status !== EVAL_STATUS.SUCCESS && (
          <Chip
            icon={<ErrorOutlineIcon sx={{ fontSize: 14 }} />}
            label={t(
              STATUS_CONFIG[status]?.label || 'evalTasks.statusUnknown',
              status === EVAL_STATUS.FORMAT_ERROR ? t('evalTasks.statusFormatError') : t('evalTasks.statusApiError')
            )}
            size="small"
            color={STATUS_CONFIG[status]?.color || 'default'}
            variant="outlined"
            sx={{ height: 24, '& .MuiChip-label': { px: 0.75, fontSize: '0.75rem' } }}
          />
        )}
      </Box>

      {/* 题目内容 */}
      <Box>
        <Typography sx={detailStyles.questionContent}>{question}</Typography>
      </Box>

      {/* 选项区域 (仅选择题/判断题) */}
      {parsedOptions.length > 0 && (
        <Box sx={detailStyles.optionsContainer}>
          {parsedOptions.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const { isSelected, isCorrectOption } = getOptionStatus(opt, idx);

            return (
              <Box key={idx} sx={detailStyles.optionItem(isSelected, isCorrectOption)}>
                <Typography sx={{ fontWeight: 600, minWidth: 24 }}>{letter}.</Typography>
                <Typography>{opt}</Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 答案对比区域 */}
      <Box sx={detailStyles.answerSection}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {t('evalTasks.modelAnswer')}
        </Typography>

        <Box ref={contentRef} sx={detailStyles.markdownContainer(isExpanded)}>
          {questionType === 'open_ended' || questionType === 'short_answer' ? (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{modelAnswer || ''}</ReactMarkdown>
            </div>
          ) : (
            <Typography
              variant="body1"
              sx={{
                color: isCorrect ? 'success.main' : 'error.main',
                fontWeight: 600,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}
            >
              {formatAnswer(modelAnswer)}
            </Typography>
          )}

          {/* 展开/收起 遮罩和按钮 */}
          {shouldShowExpand && !isExpanded && (
            <Box sx={detailStyles.expandMask}>
              <Button
                size="small"
                onClick={() => setIsExpanded(true)}
                startIcon={<ExpandMoreIcon />}
                sx={detailStyles.expandButton}
              >
                {t('common.expand', '展开全部')}
              </Button>
            </Box>
          )}
        </Box>

        {isExpanded && shouldShowExpand && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Button
              size="small"
              onClick={() => setIsExpanded(false)}
              startIcon={<ExpandLessIcon />}
              sx={{ fontSize: '0.75rem', textTransform: 'none' }}
            >
              {t('common.collapse', '收起内容')}
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {t('evalTasks.correctAnswer')}
          </Typography>
          <Box ref={correctContentRef} sx={detailStyles.markdownContainer(isCorrectExpanded)}>
            {questionType === 'open_ended' || questionType === 'short_answer' ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{correctAnswer || ''}</ReactMarkdown>
              </div>
            ) : (
              <Typography
                variant="body1"
                sx={{ fontFamily: 'monospace', color: 'text.primary', whiteSpace: 'pre-wrap' }}
              >
                {formatAnswer(correctAnswer)}
              </Typography>
            )}

            {/* 展开/收起 遮罩和按钮 */}
            {shouldShowCorrectExpand && !isCorrectExpanded && (
              <Box sx={detailStyles.expandMask}>
                <Button
                  size="small"
                  onClick={() => setIsCorrectExpanded(true)}
                  startIcon={<ExpandMoreIcon />}
                  sx={detailStyles.expandButton}
                >
                  {t('common.expand', '展开全部')}
                </Button>
              </Box>
            )}
          </Box>

          {isCorrectExpanded && shouldShowCorrectExpand && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button
                size="small"
                onClick={() => setIsCorrectExpanded(false)}
                startIcon={<ExpandLessIcon />}
                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
              >
                {t('common.collapse', '收起内容')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* 错误信息显示 */}
      {errorMessage && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: 'error.lighter',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'error.light'
          }}
        >
          <Typography variant="body2" color="error.main" sx={{ fontSize: '0.8rem' }}>
            {errorMessage}
          </Typography>
        </Box>
      )}

      {/* 教师点评 (气泡样式) */}
      {judgeResponse && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={detailStyles.judgeComment}>
            <Typography sx={detailStyles.judgeLabel}>{t('evalTasks.judgeComment')}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {getJudgeDisplayContent(judgeResponse)}
            </Typography>
            {/* 得分显示（如果是主观题） */}
            {(questionType === 'short_answer' || questionType === 'open_ended') && (
              <Typography
                sx={{
                  mt: 1,
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  borderTop: '1px dashed #d32f2f',
                  pt: 0.5
                }}
              >
                {(score * 100).toFixed(0)} {t('evalTasks.scoreUnit')}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
