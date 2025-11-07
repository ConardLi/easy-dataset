import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Box, Typography, Chip, Button, Paper, useTheme } from '@mui/material';
import { Edit as EditIcon, Restore as RestoreIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

/**
 * 右侧提示词详情展示组件
 */
const PromptDetail = ({
  currentPromptConfig,
  selectedPrompt,
  promptContent,
  isCustomized,
  onEditClick,
  onDeleteClick
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!currentPromptConfig) {
    return (
      <Box 
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          color: isDark ? '#CBD5E1' : '#64748B',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`
        }}
      >
        {t('settings.prompts.selectPromptFirst')}
      </Box>
    );
  }

  const handleEditClick = () => {
    onEditClick();
  };

  const handleDeleteClick = () => {
    onDeleteClick();
  };

  return (
    <Card
      sx={{
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 4px 24px rgba(0, 0, 0, 0.3)'
          : '0 4px 24px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden'
      }}
    >
      <CardContent
        sx={{
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
          p: 3,
          '&:last-child': {
            pb: 3
          }
        }}
      >
        {/* 标题、描述与操作区域 */}
        <Box 
          sx={{ 
            mb: 3,
            bgcolor: 'transparent'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography 
                variant="h6"
                sx={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700
                }}
              >
                {currentPromptConfig.name}
              </Typography>
              {isCustomized(selectedPrompt) && (
                <Chip 
                  label={t('settings.prompts.customized')} 
                  size="small"
                  sx={{
                    bgcolor: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Button 
                startIcon={<EditIcon />} 
                variant="contained" 
                size="small" 
                onClick={handleEditClick}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  boxShadow: isDark
                    ? '0 2px 8px rgba(99, 102, 241, 0.4)'
                    : '0 2px 8px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: isDark
                      ? '0 4px 12px rgba(99, 102, 241, 0.5)'
                      : '0 4px 12px rgba(99, 102, 241, 0.4)'
                  }
                }}
              >
                {t('settings.prompts.editPrompt')}
              </Button>

              {isCustomized(selectedPrompt) && (
                <Button 
                  startIcon={<RestoreIcon />} 
                  size="small" 
                  onClick={handleDeleteClick}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '10px',
                    color: isDark ? '#FCA5A5' : '#EF4444',
                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1.5px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
                      borderColor: '#EF4444'
                    }
                  }}
                >
                  {t('settings.prompts.restoreDefault')}
                </Button>
              )}
            </Box>
          </Box>

          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              color: isDark ? '#CBD5E1' : '#64748B'
            }}
          >
            {currentPromptConfig.description}
          </Typography>
        </Box>

        {/* Markdown 渲染提示词内容 */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            overflow: 'auto',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.8) !important' : '#F8F9FA !important',
            border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
            borderRadius: '12px',
            '& .markdown-body': {
              backgroundColor: 'transparent !important',
              color: `${isDark ? '#F8FAFC' : '#0F172A'} !important`,
              fontFamily: 'inherit',
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: `${isDark ? '#F8FAFC' : '#0F172A'} !important`,
                fontWeight: 700,
                marginTop: '1.5em',
                marginBottom: '0.75em',
                borderBottom: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(226, 232, 240, 1)',
                paddingBottom: '0.5em'
              },
              '& h1': {
                fontSize: '1.5rem'
              },
              '& h2': {
                fontSize: '1.25rem'
              },
              '& h3': {
                fontSize: '1.125rem'
              },
              '& p': {
                color: `${isDark ? '#E2E8F0' : '#334155'} !important`,
                marginBottom: '1em',
                lineHeight: 1.7
              },
              '& ul, & ol': {
                color: `${isDark ? '#E2E8F0' : '#334155'} !important`,
                paddingLeft: '1.5em',
                marginBottom: '1em'
              },
              '& li': {
                color: `${isDark ? '#E2E8F0' : '#334155'} !important`,
                marginBottom: '0.5em',
                lineHeight: 1.7
              },
              '& strong': {
                color: `${isDark ? '#F8FAFC' : '#0F172A'} !important`,
                fontWeight: 700
              },
              '& em': {
                color: `${isDark ? '#E2E8F0' : '#334155'} !important`
              },
              '& pre': {
                bgcolor: `${isDark ? 'rgba(15, 23, 42, 1)' : '#FFFFFF'} !important`,
                border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
                borderRadius: '8px',
                padding: '1em',
                overflow: 'auto',
                '& code': {
                  bgcolor: 'transparent !important',
                  color: `${isDark ? '#E0E7FF' : '#0F172A'} !important`
                }
              },
              '& code': {
                bgcolor: `${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'} !important`,
                color: `${isDark ? '#E0E7FF' : theme.palette.primary.main} !important`,
                padding: '0.2em 0.4em',
                borderRadius: '4px',
                fontSize: '0.875em',
                fontFamily: 'monospace'
              },
              '& blockquote': {
                borderLeft: `4px solid ${isDark ? 'rgba(99, 102, 241, 0.5)' : theme.palette.primary.main}`,
                paddingLeft: '1em',
                marginLeft: 0,
                color: `${isDark ? '#CBD5E1' : '#64748B'} !important`,
                fontStyle: 'italic'
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                marginBottom: '1em',
                '& th, & td': {
                  border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
                  padding: '0.5em',
                  color: `${isDark ? '#E2E8F0' : '#334155'} !important`
                },
                '& th': {
                  bgcolor: `${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'} !important`,
                  fontWeight: 700,
                  color: `${isDark ? '#F8FAFC' : '#0F172A'} !important`
                }
              },
              '& hr': {
                border: 'none',
                borderTop: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
                margin: '2em 0'
              }
            }
          }}
        >
          <div className="markdown-body">
            <ReactMarkdown>{promptContent}</ReactMarkdown>
          </div>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default PromptDetail;
