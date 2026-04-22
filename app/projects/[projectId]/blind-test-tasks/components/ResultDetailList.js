import { Box, Paper, Typography, Chip, Collapse, IconButton, Avatar, Divider, Grid } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import HelpIcon from '@mui/icons-material/Help';
import { useState } from 'react';
import 'github-markdown-css/github-markdown-light.css';

// 解析包含 <think> 标签的内容
const parseAnswerContent = text => {
  if (!text) return { thinking: '', content: '' };

  // 匹配 <think>...</think> 内容
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim(),
      content: text.replace(/<think>[\s\S]*?<\/think>/, '').trim()
    };
  }

  return { thinking: '', content: text };
};

function ResultAnswerSection({ title, rawContent, isWinner, modelLabel, t, theme }) {
  const { thinking, content } = parseAnswerContent(rawContent);
  const [showThinking, setShowThinking] = useState(false);

  const isLeft = modelLabel.includes('A') || title.includes('左');
  const avatarColor = isLeft ? 'primary.main' : 'secondary.main';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: avatarColor,
              fontSize: '0.875rem'
            }}
          >
            {modelLabel}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        {isWinner && (
          <Chip
            icon={<EmojiEventsIcon sx={{ fontSize: '1rem !important' }} />}
            label={t('blindTest.winner', '胜出')}
            size="small"
            color={isLeft ? 'primary' : 'secondary'}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          flex: 1,
          bgcolor: isWinner
            ? alpha(isLeft ? theme.palette.primary.main : theme.palette.secondary.main, 0.02)
            : 'background.paper',
          borderColor: isWinner
            ? alpha(isLeft ? theme.palette.primary.main : theme.palette.secondary.main, 0.3)
            : 'divider',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 思维链展示 */}
        {thinking && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                userSelect: 'none',
                mb: 1.5,
                p: 1,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.text.primary, 0.05),
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
                width: 'fit-content'
              }}
              onClick={() => setShowThinking(!showThinking)}
            >
              <PsychologyIcon fontSize="small" color="action" />
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                {t('playground.reasoningProcess', '推理过程')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                {showThinking ? (
                  <ExpandLessIcon fontSize="small" color="action" />
                ) : (
                  <ExpandMoreIcon fontSize="small" color="action" />
                )}
              </Box>
            </Box>
            <Collapse in={showThinking}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'grey.50',
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
                  {thinking}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* 正文内容 */}
        <div className="markdown-body" style={{ fontSize: '0.95rem', backgroundColor: 'transparent' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '-'}</ReactMarkdown>
        </div>
      </Paper>
    </Box>
  );
}

function ResultItem({ result, index, task, question }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Determine vote icon and color
  let VoteIcon = HelpIcon;
  let voteColor = 'default';
  let voteLabel = '';

  switch (result.vote) {
    case 'left':
      VoteIcon = CheckCircleIcon;
      voteColor = 'primary';
      voteLabel = t('blindTest.leftBetter', '左边更好');
      break;
    case 'right':
      VoteIcon = CheckCircleIcon;
      voteColor = 'secondary';
      voteLabel = t('blindTest.rightBetter', '右边更好');
      break;
    case 'both_good':
      VoteIcon = CheckCircleIcon;
      voteColor = 'success';
      voteLabel = t('blindTest.bothGood', '都好');
      break;
    case 'both_bad':
      VoteIcon = CancelIcon;
      voteColor = 'error';
      voteLabel = t('blindTest.bothBad', '都不好');
      break;
    default:
      VoteIcon = RemoveCircleIcon;
      voteLabel = t('blindTest.ties', '平局');
  }

  // Determine Model labels based on swap status
  const leftModelName = result.isSwapped ? task.modelInfo?.modelB?.modelName : task.modelInfo?.modelA?.modelName;
  const rightModelName = result.isSwapped ? task.modelInfo?.modelA?.modelName : task.modelInfo?.modelB?.modelName;
  const leftModelLabel = result.isSwapped ? 'B' : 'A';
  const rightModelLabel = result.isSwapped ? 'A' : 'B';

  return (
    <Paper
      sx={{
        mb: 2,
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: expanded ? 'primary.main' : 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
        }
      }}
      elevation={0}
    >
      {/* 头部摘要 */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          bgcolor: expanded ? alpha(theme.palette.primary.main, 0.02) : 'transparent'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', flex: 1 }}>
          <Box
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              fontWeight: 700
            }}
          >
            #{index + 1}
          </Box>
          <Typography
            variant="body1"
            noWrap
            sx={{
              fontWeight: 500,
              flex: 1,
              maxWidth: { xs: 200, md: 800 }
            }}
          >
            {question?.question || result.questionId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            size="small"
            icon={<VoteIcon fontSize="small" />}
            label={voteLabel}
            color={voteColor === 'default' ? 'default' : voteColor}
            variant={result.vote === 'both_good' || result.vote === 'both_bad' ? 'outlined' : 'filled'}
            sx={{ fontWeight: 600 }}
          />
          <IconButton
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 展开详情 */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 4, bgcolor: 'background.default' }}>
          <Box
            sx={{
              mb: 4,
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              QUESTION
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.6 }}>
              {question?.question}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* 左侧详情 */}
            <Grid item xs={12} md={6}>
              <ResultAnswerSection
                title={`${leftModelName}`}
                modelLabel={leftModelLabel}
                rawContent={result.leftAnswer}
                isWinner={result.vote === 'left'}
                t={t}
                theme={theme}
              />
            </Grid>

            {/* 右侧详情 */}
            <Grid item xs={12} md={6}>
              <ResultAnswerSection
                title={`${rightModelName}`}
                modelLabel={rightModelLabel}
                rawContent={result.rightAnswer}
                isWinner={result.vote === 'right'}
                t={t}
                theme={theme}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function ResultDetailList({ task }) {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        {t('blindTest.detailResults', '详细结果')}
      </Typography>

      {task.detail?.results?.map((result, index) => {
        const question = task.evalDatasets?.find(q => q.id === result.questionId);
        return <ResultItem key={index} result={result} index={index} task={task} question={question} />;
      })}
    </Box>
  );
}
