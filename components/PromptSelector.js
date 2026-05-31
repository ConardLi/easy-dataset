import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  Chip
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-light.css';
import { fetchWithRetry } from '@/lib/util/request';

const PromptSelector = ({ open, projectId, onSelect, onClose, title }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState({});
  const [customPrompts, setCustomPrompts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [promptContent, setPromptContent] = useState('');

  const getLanguageFromKey = useCallback((promptKey) => {
    if (promptKey?.endsWith('_EN')) return 'en';
    if (promptKey?.endsWith('_TR')) return 'tr';
    return 'zh-CN';
  }, []);

  const shouldShow = useCallback((promptKey) => {
    return getLanguageFromKey(promptKey) === currentLanguage;
  }, [currentLanguage, getLanguageFromKey]);

  useEffect(() => {
    if (!open || !projectId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchWithRetry(`/api/projects/${projectId}/custom-prompts?language=${currentLanguage}`);
        const data = await res.json();
        if (data.success) {
          setTemplates(data.templates);
          setCustomPrompts(data.customPrompts);
        } else {
          setError(data.message || 'Failed to load prompts');
        }
      } catch (err) {
        setError('Failed to load prompts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, projectId, currentLanguage]);

  useEffect(() => {
    if (Object.keys(templates).length > 0 && !selectedCategory) {
      const first = Object.keys(templates)[0];
      setSelectedCategory(first);
      const entries = Object.keys(templates[first]?.prompts || {});
      const firstPrompt = entries.find((k) => shouldShow(k));
      if (firstPrompt) setSelectedPrompt(firstPrompt);
    }
  }, [templates, selectedCategory, shouldShow]);

  useEffect(() => {
    if (!selectedPrompt || !selectedCategory || !templates[selectedCategory]) {
      setPromptContent('');
      return;
    }
    const config = templates[selectedCategory]?.prompts?.[selectedPrompt];
    if (!config) return;
    const lang = getLanguageFromKey(selectedPrompt);
    const existing = customPrompts.find(
      (p) => p.promptType === config.type && p.promptKey === selectedPrompt && p.language === lang
    );
    if (existing) {
      setPromptContent(existing.content);
    } else {
      loadDefaultContent(config.type, selectedPrompt);
    }
  }, [selectedPrompt, selectedCategory, templates, customPrompts, getLanguageFromKey]);

  const loadDefaultContent = async (promptType, promptKey) => {
    try {
      const res = await fetchWithRetry(
        `/api/projects/${projectId}/default-prompts?promptType=${promptType}&promptKey=${promptKey}`
      );
      const data = await res.json();
      setPromptContent(data.success ? data.content : '');
    } catch {
      setPromptContent('');
    }
  };

  const handleCategoryChange = (_, newVal) => {
    setSelectedCategory(newVal);
    const entries = Object.keys(templates[newVal]?.prompts || {});
    const first = entries.find((k) => shouldShow(k));
    setSelectedPrompt(first || null);
  };

  const handleSelect = () => {
    if (!selectedPrompt || !selectedCategory || !templates[selectedCategory]) return;
    const config = templates[selectedCategory]?.prompts?.[selectedPrompt];
    if (!config) return;
    onSelect({
      category: selectedCategory,
      promptType: config.type,
      promptKey: selectedPrompt,
      language: getLanguageFromKey(selectedPrompt) || currentLanguage,
      name: config.name,
      description: config.description,
      content: promptContent
    });
  };

  const categoryEntries = Object.entries(templates);
  const currentCategoryConfig = selectedCategory ? templates[selectedCategory] : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title || t('settings.prompts.selectPrompt')}</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <>
            <Tabs
              value={selectedCategory || ''}
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              {categoryEntries.map(([key, cat]) => (
                <Tab key={key} label={cat.displayName[currentLanguage] || key} value={key} />
              ))}
            </Tabs>

            <Box sx={{ display: 'flex', gap: 3, minHeight: 400 }}>
              <Box sx={{ width: 280, flexShrink: 0, overflow: 'auto', borderRight: 1, borderColor: 'divider', pr: 2 }}>
                {currentCategoryConfig ? (
                  <List dense>
                    {Object.entries(currentCategoryConfig.prompts).map(([promptKey, promptConfig]) => {
                      if (!shouldShow(promptKey)) return null;
                      const lang = getLanguageFromKey(promptKey);
                      const customized = customPrompts.some(
                        (p) => p.promptType === promptConfig.type && p.promptKey === promptKey && p.language === lang
                      );
                      return (
                        <ListItemButton
                          key={promptKey}
                          selected={selectedPrompt === promptKey}
                          onClick={() => setSelectedPrompt(promptKey)}
                        >
                          <ListItemText
                            primary={promptConfig.name}
                            secondary={
                              customized ? (
                                <Chip label={t('settings.prompts.customized')} color="primary" size="small" />
                              ) : null
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    {t('settings.prompts.noPromptsAvailable')}
                  </Typography>
                )}
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {selectedPrompt && currentCategoryConfig?.prompts?.[selectedPrompt] ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {currentCategoryConfig.prompts[selectedPrompt].name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {currentCategoryConfig.prompts[selectedPrompt].description}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptContent}</ReactMarkdown>
                      </div>
                    </Paper>
                  </>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                    {t('settings.prompts.selectPromptFirst')}
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedPrompt}
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptSelector;
