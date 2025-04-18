import { useCallback } from 'react';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import axios from 'axios';
import { useAtomValue } from 'jotai/index';
import { selectedModelInfoAtom } from '@/lib/store';
import { useTranslation } from 'react-i18next';

export function useGenerateDataset() {
  const model = useAtomValue(selectedModelInfoAtom);
  const { t } = useTranslation();

  const generateSingleDataset = useCallback(
    async ({ projectId, questionId, questionInfo }) => {
      // 获取模型参数
      if (!model) {
        toast.error(t('models.configNotFound'));
        return null;
      }
      // 调用API生成数据集
      const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';
      toast.promise(
        axios.post(`/api/projects/${projectId}/datasets`, {
          questionId,
          model,
          language: currentLanguage
        }),
        {
          loading: t('datasets.generating'),
          description: `问题：【${questionInfo}】`,
          position: 'top-right',
          success: data => {
            return '生成数据集成功';
          },
          error: error => {
            return t('datasets.generateFailed', { error: error.response?.data?.error });
          }
        }
      );
    },
    [model, t]
  );

  const generateMultipleDataset = useCallback(
    async (projectId, questions) => {
      let completed = 0;
      const total = questions.length;
      // 显示带进度的Loading
      const loadingToastId = toast.loading(`正在处理请求 (${completed}/${total})...`, { position: 'top-right' });

      // 处理每个请求
      const processRequest = async question => {
        try {
          const response = await axios.post(`/api/projects/${projectId}/datasets`, {
            questionId: question.id,
            model,
            language: i18n.language === 'zh-CN' ? '中文' : 'en'
          });
          const data = response.data;
          completed++;
          toast.success(`${question.question} 完成`, { position: 'top-right' });
          toast.loading(`正在处理请求 (${completed}/${total})...`, { id: loadingToastId });
          return data;
        } catch (error) {
          completed++;
          toast.error(`${question.question} 失败`, {
            description: error.message,
            position: 'top-right'
          });
          toast.loading(`正在处理请求 (${completed}/${total})...`, { id: loadingToastId });
          throw error;
        }
      };

      try {
        const results = await Promise.allSettled(questions.map(req => processRequest(req)));
        // 全部完成后更新Loading为完成状态
        toast.success(`全部请求处理完成 (成功: ${results.filter(r => r.status === 'fulfilled').length}/${total})`, {
          id: loadingToastId,
          position: 'top-right'
        });
        return results;
      } catch {
        // Promise.allSettled不会进入catch，这里只是保险
      }
    },
    [model, t]
  );

  return { generateSingleDataset, generateMultipleDataset };
}
