'use client';

import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChatMessage from './ChatMessage';
import { playgroundStyles } from '@/styles/playground';
import { useTranslation } from 'react-i18next';

const ChatArea = ({ selectedModels, conversations, loading, getModelName }) => {
  const theme = useTheme();
  const styles = playgroundStyles(theme);
  const { t } = useTranslation();

  // 为每个模型创建独立的引用
  const chatContainerRefs = {
    model1: useRef(null),
    model2: useRef(null),
    model3: useRef(null)
  };

  // 为每个模型的聊天容器自动滚动到底部
  useEffect(() => {
    Object.values(chatContainerRefs).forEach(ref => {
      if (ref.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    });
  }, [conversations]);

  if (selectedModels.length === 0) {
    return (
      <Box sx={styles.emptyStateBox}>
        <Typography color="textSecondary">{t('playground.selectModelFirst')}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={styles.chatContainer}>
      {selectedModels.map((modelId, index) => {
        const modelConversation = conversations[modelId] || [];
        const isLoading = loading[modelId];
        const refKey = `model${index + 1}`;

        return (
          <Grid
            item
            xs={12}
            md={selectedModels.length > 1 ? 12 / selectedModels.length : 12}
            key={modelId}
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            <Paper elevation={1} sx={styles.modelPaper}>
              <Box sx={styles.modelHeader}>
                <Typography variant="subtitle2">{getModelName(modelId)}</Typography>
                {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} color="inherit" />}
              </Box>

              <Box ref={chatContainerRefs[refKey]} sx={styles.modelChatBox}>
                {modelConversation.length === 0 ? (
                  <Box sx={styles.emptyChatBox}>
                    <Typography color="textSecondary" variant="body2">
                      {t('playground.sendFirstMessage')}
                    </Typography>
                  </Box>
                ) : (
                  modelConversation.map((message, msgIndex) => (
                    <React.Fragment key={msgIndex}>
                      <ChatMessage message={message} modelName={null} />
                    </React.Fragment>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ChatArea;
