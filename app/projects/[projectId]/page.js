'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useSetAtom } from 'jotai/index';
import { modelConfigListAtom } from '@/lib/store';

export default function ProjectPage({ params }) {
  const router = useRouter();
  const setConfigList = useSetAtom(modelConfigListAtom);
  const { projectId } = params;

  // 默认重定向到文本分割页面
  useEffect(() => {
    getModelConfigList(projectId);
    router.push(`/projects/${projectId}/text-split`);
  }, [projectId, router]);

  const getModelConfigList = projectId => {
    axios
      .get(`/api/projects/${projectId}/model-config`)
      .then(response => {
        setConfigList(response.data);
      })
      .catch(error => {
        toast.error('获取模型列表失败');
      });
  };

  return null;
}
