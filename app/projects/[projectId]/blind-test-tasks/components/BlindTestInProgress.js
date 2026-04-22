import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-light.css';
import { blindTestStyles } from '@/styles/blindTest';

function AnswerBox({ title, modelLabel, answer, streaming, showThinking, setShowThinking, scrollRef, styles, theme }) {
  const { t } = useTranslation();
  const isLeft = modelLabel === 'A';
  const avatarColor = isLeft ? 'primary.main' : 'secondary.main';

  return (
    <Paper
      elevation={0}
      sx={{
        ...styles.answerPaper,
        border: '1px solid',
        borderColor: streaming ? (isLeft ? 'primary.main' : 'secondary.main') : 'divider',
        boxShadow: streaming ? `0 0 0 2px ${alpha(theme.palette[isLeft ? 'primary' : 'secondary'].main, 0.1)}` : 'none',
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          ...styles.answerHeader,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: avatarColor,
              fontSize: '0.75rem'
            }}
          >
            {modelLabel}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
          {streaming && <CircularProgress size={14} color={isLeft ? 'primary' : 'secondary'} />}
        </Box>
        {answer?.duration > 0 && !streaming && (
          <Chip
            label={`${(answer.duration / 1000).toFixed(1)}s`}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.75rem', bgcolor: 'background.paper' }}
          />
        )}
      </Box>

      {answer?.error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" variant="outlined">
            {answer.error}
          </Alert>
        </Box>
      ) : (
        <Box ref={scrollRef} sx={{ ...styles.answerContent, flex: 1 }}>
          {/* 思维链渲染 */}
          {answer?.thinking && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                  p: 1,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setShowThinking(!showThinking)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {answer.isThinking ? (
                    <AutoFixHighIcon
                      fontSize="small"
                      color="primary"
                      sx={{
                        animation: 'thinking-pulse 1.5s infinite',
                        '@keyframes thinking-pulse': {
                          '0%': { opacity: 0.4 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.4 }
                        }
                      }}
                    />
                  ) : (
                    <PsychologyIcon fontSize="small" color="action" />
                  )}
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    {t('playground.reasoningProcess', '推理过程')}
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ p: 0.5 }}>
                  {showThinking ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
              <Collapse in={showThinking}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'grey.50',
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    mb: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    maxHeight: 300,
                    overflowY: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                    {answer.thinking}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}

          {answer?.content ? (
            <div className="markdown-body" style={{ fontSize: '0.95rem', backgroundColor: 'transparent' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer.content}</ReactMarkdown>
            </div>
          ) : streaming ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                color: 'text.secondary',
                mt: 4,
                justifyContent: 'center'
              }}
            >
              <SmartToyIcon sx={{ opacity: 0.5 }} />
              <Typography variant="body2">{t('blindTest.generatingAnswers', '正在生成回答...')}</Typography>
            </Box>
          ) : null}
        </Box>
      )}
    </Paper>
  );
}

export default function BlindTestInProgress({
  task,
  currentQuestion,
  leftAnswer,
  rightAnswer,
  streamingA,
  streamingB,
  answersLoading,
  voting,
  onVote,
  onReload
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = blindTestStyles(theme);

  const [showThinkingLeft, setShowThinkingLeft] = useState(true);
  const [showThinkingRight, setShowThinkingRight] = useState(true);

  // 自动滚动引用
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);

  // 处理自动滚动
  useEffect(() => {
    if (streamingA && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
  }, [leftAnswer?.content, leftAnswer?.thinking, streamingA]);

  useEffect(() => {
    if (streamingB && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = rightScrollRef.current.scrollHeight;
    }
  }, [rightAnswer?.content, rightAnswer?.thinking, streamingB]);

  const progress = task ? (task.completedCount / task.totalCount) * 100 : 0;

  if (answersLoading && !currentQuestion) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography color="text.secondary" variant="h6" sx={{ fontWeight: 500 }}>
          {t('blindTest.generatingAnswers', '正在准备题目...')}
        </Typography>
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<RefreshIcon />}
          onClick={onReload}
          sx={{ borderRadius: 3, px: 4, py: 1.5, boxShadow: 4 }}
        >
          {t('blindTest.loadQuestion', '加载题目')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      {/* 顶部进度和问题 */}
      <Paper
        elevation={0}
        sx={{
          ...styles.questionPaper,
          p: 0,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <Box sx={{ bgcolor: 'background.default', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
              {t('blindTest.progress', '进度')} {task.completedCount + 1}/{task.totalCount}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { borderRadius: 4 }
                }}
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
            {currentQuestion.question}
          </Typography>
        </Box>
      </Paper>

      {/* 回答区域 */}
      <Box sx={{ ...styles.answersContainer, gap: 3 }}>
        <AnswerBox
          title={t('blindTest.answerA', '回答 A')}
          modelLabel="A"
          answer={leftAnswer}
          streaming={streamingA}
          showThinking={showThinkingLeft}
          setShowThinking={setShowThinkingLeft}
          scrollRef={leftScrollRef}
          styles={styles}
          theme={theme}
        />
        <AnswerBox
          title={t('blindTest.answerB', '回答 B')}
          modelLabel="B"
          answer={rightAnswer}
          streaming={streamingB}
          showThinking={showThinkingRight}
          setShowThinking={setShowThinkingRight}
          scrollRef={rightScrollRef}
          styles={styles}
          theme={theme}
        />
      </Box>

      {/* 底部投票区域 */}
      <Paper
        elevation={10}
        sx={{
          ...styles.voteBar,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          width: 'fit-content',
          minWidth: 800,
          mx: 'auto'
        }}
      >
        <Box sx={styles.voteButtons}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ThumbUpIcon />}
            onClick={() => onVote('left')}
            disabled={voting || streamingA || streamingB}
            sx={{ ...styles.voteBtn, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            {t('blindTest.leftBetter', '左边更好')}
          </Button>
          <Button
            variant="outlined"
            color="success"
            size="large"
            startIcon={<ThumbsUpDownIcon />}
            onClick={() => onVote('both_good')}
            disabled={voting || streamingA || streamingB}
            sx={{ ...styles.voteBtn, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            {t('blindTest.bothGood', '都好')}
          </Button>
          <Tooltip
            title={
              currentQuestion?.answer ? (
                <Box sx={{ p: 1, maxWidth: 400 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}
                  >
                    <AssignmentIcon fontSize="small" color="primary" />
                    {t('blindTest.referenceAnswer', '参考答案')}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', color: 'text.secondary' }}
                  >
                    {currentQuestion.answer}
                  </Typography>
                </Box>
              ) : (
                t('blindTest.noReferenceAnswer', '暂无参考答案')
              )
            }
            arrow
            placement="top"
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper',
                  color: 'text.primary',
                  boxShadow: theme.shadows[8],
                  border: `1px solid ${theme.palette.divider}`,
                  p: 0,
                  '& .MuiTooltip-arrow': {
                    color: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper',
                    '&::before': {
                      border: `1px solid ${theme.palette.divider}`
                    }
                  }
                }
              }
            }}
          >
            <Button
              variant="text"
              size="large"
              startIcon={<InfoOutlinedIcon />}
              sx={{
                ...styles.voteBtn,
                color: 'text.secondary',
                minWidth: 'auto',
                px: 2
              }}
            >
              {t('blindTest.referenceAnswer', '参考答案')}
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<ThumbDownIcon />}
            onClick={() => onVote('both_bad')}
            disabled={voting || streamingA || streamingB}
            sx={{ ...styles.voteBtn, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            {t('blindTest.bothBad', '都不好')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<ThumbUpIcon />}
            onClick={() => onVote('right')}
            disabled={voting || streamingA || streamingB}
            sx={{ ...styles.voteBtn, bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            {t('blindTest.rightBetter', '右边更好')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
