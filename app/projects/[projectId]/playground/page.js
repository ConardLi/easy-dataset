'use client';

import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { useParams } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import ChatArea from '@/components/playground/ChatArea';
import MessageInput from '@/components/playground/MessageInput';
import PlaygroundHeader from '@/components/playground/PlaygroundHeader';
import useModelPlayground from '@/hooks/useModelPlayground';
import { playgroundStyles } from '@/styles/playground';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai/index';
import { modelConfigListAtom } from '@/lib/store';

export default function ModelPlayground({ searchParams }) {
  const theme = useTheme();
  const params = useParams();
  const { projectId } = params;
  const modelId = searchParams?.modelId || null;
  const styles = playgroundStyles(theme);
  const { t } = useTranslation();

  const {
    selectedModels,
    loading,
    userInput,
    conversations,
    error,
    outputMode,
    uploadedImage,
    handleModelSelection,
    handleInputChange,
    handleImageUpload,
    handleRemoveImage,
    handleSendMessage,
    handleClearConversations,
    handleOutputModeChange
  } = useModelPlayground(projectId, modelId);

  const availableModels = useAtomValue(modelConfigListAtom);

  // 获取模型名称
  const getModelName = modelId => {
    const model = availableModels.find(m => m.id === modelId);
    return model ? `${model.providerName}: ${model.modelName}` : modelId;
  };
  return (
    <Box sx={styles.container}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('playground.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={styles.mainPaper}>
        <PlaygroundHeader
          availableModels={availableModels}
          selectedModels={selectedModels}
          handleModelSelection={handleModelSelection}
          handleClearConversations={handleClearConversations}
          conversations={conversations}
          outputMode={outputMode}
          handleOutputModeChange={handleOutputModeChange}
        />

        <ChatArea
          selectedModels={selectedModels}
          conversations={conversations}
          loading={loading}
          getModelName={getModelName}
        />

        <MessageInput
          userInput={userInput}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          loading={loading}
          selectedModels={selectedModels}
          uploadedImage={uploadedImage}
          handleImageUpload={handleImageUpload}
          handleRemoveImage={handleRemoveImage}
          availableModels={availableModels}
        />
      </Paper>
    </Box>
  );
}
