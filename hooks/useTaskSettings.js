import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_SETTINGS } from '@/constant/setting';

export default function useTaskSettings(projectId) {
  const { t } = useTranslation();
  const [taskSettings, setTaskSettings] = useState({
    ...DEFAULT_SETTINGS
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [visionModels,setVisionModels] = useState([]);

  useEffect(() => {
    async function fetchTaskSettings() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/tasks`);
        if (!response.ok) {
          throw new Error(t('settings.fetchTasksFailed'));
        }

        const data = await response.json();

        // 如果没有配置，使用默认值
        if (Object.keys(data).length === 0) {
          setTaskSettings({
            ...DEFAULT_SETTINGS
          });
        } else {
          setTaskSettings({
            ...DEFAULT_SETTINGS,
            ...data
          });
        }

        const modelResponse = await fetch(`/api/projects/${projectId}/models`);

        if (!response.ok) {
          throw new Error(t('models.fetchFailed'));
        }

        //获取所有模型
        const model = await modelResponse.json();

        //过滤出视觉模型
        const visionItems = model.filter(item => (item.type === 'vision') &&item.apiKey);
      
        setVisionModels(visionItems);

      } catch (error) {
        console.error('获取任务配置出错:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTaskSettings();
  }, [projectId, t]);

  return {
    taskSettings,
    setTaskSettings,
    loading,
    error,
    success,
    setSuccess,
    visionModels
  };
}
