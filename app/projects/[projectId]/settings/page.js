'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper, Alert, CircularProgress } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// 导入设置组件
import BasicSettings from '@/components/settings/BasicSettings';
import ModelSettings from '@/components/settings/ModelSettings';
import TaskSettings from '@/components/settings/TaskSettings';
import PromptSettings from './components/PromptSettings';

// 定义 TAB 枚举
const TABS = {
  BASIC: 'basic',
  MODEL: 'model',
  TASK: 'task',
  PROMPTS: 'prompts'
};

export default function SettingsPage({ params }) {
  const { t } = useTranslation();
  const { projectId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS.BASIC);
  const [projectExists, setProjectExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 URL hash 中获取当前 tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && Object.values(TABS).includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 检查项目是否存在
  useEffect(() => {
    async function checkProject() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setProjectExists(false);
          } else {
            throw new Error(t('projects.fetchFailed'));
          }
        } else {
          setProjectExists(true);
        }
      } catch (error) {
        console.error('获取项目详情出错:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    checkProject();
  }, [projectId, t]);

  // 处理 tab 切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // 更新 URL hash
    router.push(`/projects/${projectId}/settings?tab=${newValue}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!projectExists) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{t('projects.notExist')}</Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          aria-label={t('settings.tabsAriaLabel')}
        >
          <Tab value={TABS.BASIC} label={t('settings.basicInfo')} />
          <Tab value={TABS.MODEL} label={t('settings.modelConfig')} />
          <Tab value={TABS.TASK} label={t('settings.taskConfig')} />
          <Tab value={TABS.PROMPTS} label={t('settings.promptConfig')} />
        </Tabs>
      </Paper>

      {activeTab === TABS.BASIC && <BasicSettings projectId={projectId} />}

      {activeTab === TABS.MODEL && <ModelSettings projectId={projectId} />}

      {activeTab === TABS.TASK && <TaskSettings projectId={projectId} />}

      {activeTab === TABS.PROMPTS && <PromptSettings projectId={projectId} />}
    </Container>
  );
}
