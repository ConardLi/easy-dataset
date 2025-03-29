import React from 'react';
import { Box, Paper, Typography, Alert, useTheme } from '@mui/material';

/**
 * 聊天消息组件
 * @param {Object} props
 * @param {Object} props.message - 消息对象
 * @param {string} props.message.role - 消息角色：'user'、'assistant' 或 'error'
 * @param {string} props.message.content - 消息内容
 * @param {string} props.modelName - 模型名称（仅在 assistant 或 error 类型消息中显示）
 */
export default function ChatMessage({ message, modelName }) {
  const theme = useTheme();

  // 用户消息
  if (message.role === 'user') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: '16px 16px 0 16px',
            maxWidth: '80%',
            bgcolor: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
      </Box>
    );
  }

  // 助手消息
  if (message.role === 'assistant') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 2
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: '16px 16px 16px 0',
            maxWidth: '80%',
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]
          }}
        >
          {modelName && (
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
              {modelName}
            </Typography>
          )}
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
            {message.isStreaming && <span className="blinking-cursor">|</span>}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // 错误消息
  if (message.role === 'error') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 2
        }}
      >
        <Alert severity="error" sx={{ maxWidth: '80%' }}>
          {modelName && (
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              {modelName}
            </Typography>
          )}
          {message.content}
        </Alert>
      </Box>
    );
  }

  return null;
}
