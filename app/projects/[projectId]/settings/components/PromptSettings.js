import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Card, CardContent, useTheme } from '@mui/material';
import { fetchWithRetry } from '@/lib/util/request';
import { useSnackbar } from '@/hooks/useSnackbar';

// 导入拆分后的组件
import CategoryTabs from './CategoryTabs';
import PromptList from './PromptList';
import PromptDetail from './PromptDetail';
import PromptEditDialog from './PromptEditDialog';
import { getLanguageFromPromptKey, shouldShowPrompt } from './promptUtils';

/**
 * 提示词设置主组件
 */
export default function PromptSettings() {
  const { projectId } = useParams();
  const { i18n, t } = useTranslation();
  const { showSuccess, showErrorMessage, SnackbarComponent } = useSnackbar();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 基础状态
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language === 'en' ? 'en' : 'zh-CN');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState({});
  const [customPrompts, setCustomPrompts] = useState([]);

  // 当前选中状态
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [promptContent, setPromptContent] = useState('');

  // 编辑对话框状态
  const [editDialog, setEditDialog] = useState({
    open: false,
    promptType: '',
    promptKey: '',
    language: '',
    content: '',
    defaultContent: '',
    isNew: false
  });

  // ======= 数据加载与初始化 =======

  // 加载提示词数据
  useEffect(() => {
    loadPromptData();
  }, [projectId, currentLanguage]);

  // 监听语言变化
  useEffect(() => {
    const newLang = i18n.language === 'en' ? 'en' : 'zh-CN';
    if (newLang !== currentLanguage) {
      setCurrentLanguage(newLang);
    }
  }, [i18n.language, currentLanguage]);

  // 监听选中提示词变化
  useEffect(() => {
    if (selectedPrompt) {
      loadPromptContent();
    }
  }, [selectedPrompt]);

  // 初始化选择第一个分类和提示词
  useEffect(() => {
    if (Object.keys(templates).length > 0 && currentLanguage && !selectedCategory) {
      const firstCategory = Object.keys(templates)[0];
      setSelectedCategory(firstCategory);

      // 根据当前语言环境选择第一个匹配的提示词
      const promptEntries = Object.keys(templates[firstCategory]?.prompts || {});
      const firstPrompt = promptEntries.find(promptKey => shouldShowPrompt(promptKey, currentLanguage));

      if (firstPrompt) {
        setSelectedPrompt(firstPrompt);
      }
    }
  }, [templates, selectedCategory, currentLanguage]);

  // ======= API 操作函数 =======

  // 加载提示词数据
  const loadPromptData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithRetry(`/api/projects/${projectId}/custom-prompts?language=${currentLanguage}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
        setCustomPrompts(data.customPrompts);
      } else {
        showErrorMessage(data.message || '加载提示词数据失败');
      }
    } catch (error) {
      console.error('加载提示词数据出错:', error);
      showErrorMessage('加载提示词数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载提示词内容
  const loadPromptContent = async (forceRefresh = false) => {
    if (!selectedPrompt) return;
    try {
      setLoading(true);
      const content = await getCurrentPromptContent(selectedPrompt, forceRefresh);
      setPromptContent(content);
    } catch (error) {
      console.error('加载提示词内容出错:', error);
      showErrorMessage('加载提示词内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载默认提示词内容
  const loadDefaultContent = async (promptType, promptKey) => {
    if (i18n.language === 'en' && !promptKey.endsWith('_EN')) {
      promptKey += '_EN';
    }
    try {
      const response = await fetchWithRetry(
        `/api/projects/${projectId}/default-prompts?promptType=${promptType}&promptKey=${promptKey}`
      );
      const data = await response.json();

      if (data.success) {
        return data.content;
      }
      return '';
    } catch (error) {
      console.error('加载默认提示词内容出错:', error);
      return '';
    }
  };

  // ======= 交互处理函数 =======

  // 处理编辑提示词
  const handleEditPrompt = async (promptType, promptKey, language) => {
    const existingPrompt = customPrompts.find(
      p => p.promptType === promptType && p.promptKey === promptKey && p.language === language
    );

    const defaultContent = await loadDefaultContent(promptType, promptKey);

    setEditDialog({
      open: true,
      promptType,
      promptKey,
      language,
      content: existingPrompt?.content || defaultContent,
      defaultContent,
      isNew: !existingPrompt
    });
  };

  // 处理删除提示词
  const handleDeletePrompt = async (promptType, promptKey, language) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        promptType,
        promptKey,
        language
      }).toString();

      const response = await fetchWithRetry(`/api/projects/${projectId}/custom-prompts?${query}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        showSuccess(t('settings.prompts.restoreSuccess'));
        // 先重新加载数据，然后强制刷新内容
        await loadPromptData();
        await loadPromptContent(true); // 强制刷新
      } else {
        showErrorMessage(data.message || t('settings.prompts.restoreFailed'));
      }
    } catch (error) {
      console.error(t('settings.prompts.deleteError'), error);
      showErrorMessage(t('settings.prompts.restoreFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 处理保存提示词
  const handleSavePrompt = async () => {
    try {
      setLoading(true);
      const { promptType, promptKey, language, content } = editDialog;

      const response = await fetchWithRetry(`/api/projects/${projectId}/custom-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType, promptKey, language, content })
      });
      const data = await response.json();

      if (data.success) {
        showSuccess(t('settings.prompts.saveSuccess'));
        setEditDialog({ ...editDialog, open: false });
        // 先重新加载数据，然后强制刷新内容
        await loadPromptData();
        await loadPromptContent(true); // 强制刷新
      } else {
        showErrorMessage(data.message || t('settings.prompts.saveFailed'));
      }
    } catch (error) {
      console.error(t('settings.prompts.saveError'), error);
      showErrorMessage(t('settings.prompts.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 恢复默认内容
  const handleRestoreDefault = () => {
    setEditDialog(prev => ({
      ...prev,
      content: prev.defaultContent
    }));
  };

  // ======= 工具函数 =======

  // 检查提示词是否已自定义
  const isCustomized = promptKey => {
    if (!selectedCategory || !promptKey || !templates[selectedCategory]) return false;

    const language = getLanguageFromPromptKey(promptKey);
    const promptType = templates[selectedCategory]?.prompts?.[promptKey]?.type;

    if (!promptType) return false;

    return customPrompts.some(p => p.promptType === promptType && p.promptKey === promptKey && p.language === language);
  };

  // 获取当前提示词内容（直接从服务器获取最新数据）
  const getCurrentPromptContent = async (promptKey, forceRefresh = false) => {
    if (!selectedCategory || !promptKey || !templates[selectedCategory]) return '';

    const language = getLanguageFromPromptKey(promptKey);
    const promptType = templates[selectedCategory]?.prompts?.[promptKey]?.type;

    if (!promptType) {
      return '';
    }

    // 如果需要强制刷新，直接从服务器获取
    if (forceRefresh) {
      try {
        const response = await fetchWithRetry(
          `/api/projects/${projectId}/custom-prompts?promptType=${promptType}&language=${language}`
        );
        const data = await response.json();

        if (data.success) {
          const existingPrompt = data.customPrompts.find(
            p => p.promptType === promptType && p.promptKey === promptKey && p.language === language
          );

          if (existingPrompt) {
            return existingPrompt.content;
          }
        }
      } catch (error) {
        console.error(t('settings.prompts.fetchContentError'), error);
      }
    } else {
      // 使用缓存的状态
      const existingPrompt = customPrompts.find(
        p => p.promptType === promptType && p.promptKey === promptKey && p.language === language
      );

      if (existingPrompt) {
        return existingPrompt.content;
      }
    }

    // 回退到默认内容
    return await loadDefaultContent(promptType, promptKey);
  };

  // ======= 数据准备 =======

  // 当前分类的配置
  const currentCategoryConfig = templates[selectedCategory];

  // 当前提示词的配置
  const currentPromptConfig = currentCategoryConfig?.prompts?.[selectedPrompt];

  // 分类配置项
  const categoryEntries = Object.entries(templates);

  // 处理分类变更
  const handleCategoryChange = newCategory => {
    setSelectedCategory(newCategory);
    // 根据当前语言环境选择第一个匹配的提示词
    const promptEntries = Object.keys(templates[newCategory]?.prompts || {});
    console.log('所有提示词:', promptEntries);

    const firstPrompt = promptEntries.find(promptKey => shouldShowPrompt(promptKey, currentLanguage));

    setSelectedPrompt(firstPrompt);
  };

  // 处理编辑按钮点击
  const handleEditButtonClick = () => {
    const promptType = templates[selectedCategory]?.prompts?.[selectedPrompt]?.type;
    // 使用当前界面语言而不是从 promptKey 推断的语言
    const language = currentLanguage;

    if (promptType) {
      handleEditPrompt(promptType, selectedPrompt, language);
    }
  };

  // 处理删除按钮点击
  const handleDeleteButtonClick = () => {
    const promptType = templates[selectedCategory]?.prompts?.[selectedPrompt]?.type;
    // 使用当前界面语言而不是从 promptKey 推断的语言
    const language = currentLanguage;

    if (promptType) {
      handleDeletePrompt(promptType, selectedPrompt, language);
    }
  };

  // 处理对话框内容变更
  const handleDialogContentChange = newContent => {
    setEditDialog({ ...editDialog, content: newContent });
  };

  return (
    <Box>
      <SnackbarComponent />

      {/* 主要分类选择 */}
      <CategoryTabs
        categoryEntries={categoryEntries}
        selectedCategory={selectedCategory}
        currentLanguage={currentLanguage}
        onCategoryChange={handleCategoryChange}
      />

      {/* 左右布局：左侧垂直提示词选择，右侧内容展示 */}
      <Grid container spacing={3}>
        {/* 左侧：垂直 TAB 选择具体提示词 */}
        <Grid item xs={12} md={4} lg={3}>
          <Card
            sx={{
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
              borderRadius: '16px',
              boxShadow: isDark
                ? '0 4px 24px rgba(0, 0, 0, 0.3)'
                : '0 4px 24px rgba(15, 23, 42, 0.08)'
            }}
          >
            <CardContent>
              <PromptList
                currentCategory={selectedCategory}
                currentCategoryConfig={currentCategoryConfig}
                selectedPrompt={selectedPrompt}
                currentLanguage={currentLanguage}
                isCustomized={isCustomized}
                onPromptSelect={setSelectedPrompt}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧：提示词内容展示和操作 */}
        <Grid item xs={12} md={8} lg={9}>
          <PromptDetail
            currentPromptConfig={currentPromptConfig}
            selectedPrompt={selectedPrompt}
            promptContent={promptContent}
            isCustomized={isCustomized}
            onEditClick={handleEditButtonClick}
            onDeleteClick={handleDeleteButtonClick}
          />
        </Grid>
      </Grid>

      {/* 编辑提示词对话框 */}
      <PromptEditDialog
        open={editDialog.open}
        title={editDialog.isNew ? t('settings.prompts.createCustomPrompt') : t('settings.prompts.editPrompt')}
        promptType={editDialog.promptType}
        promptKey={editDialog.promptKey}
        content={editDialog.content}
        loading={loading}
        onClose={() => setEditDialog({ ...editDialog, open: false })}
        onSave={handleSavePrompt}
        onRestore={handleRestoreDefault}
        onContentChange={handleDialogContentChange}
      />
    </Box>
  );
}
