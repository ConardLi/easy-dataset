'use client';

import React from 'react';
import { Box, Typography, Paper, Alert, Container, useMediaQuery } from '@mui/material';
import { useParams } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import ChatArea from '@/components/playground/ChatArea';
import MessageInput from '@/components/playground/MessageInput';
import PlaygroundHeader from '@/components/playground/PlaygroundHeader';
import ParticleBackground from '@/components/home/ParticleBackground';
import useModelPlayground from '@/hooks/useModelPlayground';
import { playgroundStyles } from '@/styles/playground';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai/index';
import { modelConfigListAtom } from '@/lib/store';
import { motion } from 'framer-motion';
import SmartToyIcon from '@mui/icons-material/SmartToy';

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
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <main style={{ 
      overflow: 'hidden', 
      position: 'relative', 
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* Hero Section - 参考首页风格 */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 6, md: 8 },
          pb: { xs: 4, md: 6 },
          overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.1) 0%, transparent 50%), #0A0E27'
            : 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.05) 0%, transparent 50%), #FAFBFC'
        }}
      >
        {/* 科技风格网格背景 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isDark
              ? `linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            opacity: 0.4,
            zIndex: 0
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            sx={{
              textAlign: 'center',
              maxWidth: '780px',
              mx: 'auto'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <SmartToyIcon
                sx={{
                  fontSize: { xs: 36, md: 44 },
                  mr: 2,
                  color: theme.palette.primary.main,
                  filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}40)`
                }}
              />
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                sx={{
                  fontSize: { xs: '1.9rem', md: '2.6rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  background: theme.palette.gradient.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                {t('playground.title')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 内容区域 */}
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: -4, md: -6 },
          mb: { xs: 6, md: 8 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: '12px',
                background: isDark ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
                border: `1px solid ${isDark ? 'rgba(211, 47, 47, 0.3)' : 'rgba(211, 47, 47, 0.2)'}`
              }}
            >
              {error}
            </Alert>
          )}

          <Paper 
            elevation={0}
            sx={{
              ...styles.mainPaper,
              borderRadius: '20px',
              background: isDark
                ? 'rgba(15, 23, 42, 0.8)'
                : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark
                ? '1px solid rgba(99, 102, 241, 0.2)'
                : '1px solid rgba(226, 232, 240, 1)',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)'
            }}
          >
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
        </motion.div>
      </Container>
    </main>
  );
}
