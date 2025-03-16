'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ProjectLayout({ children, params }) {
  const router = useRouter();
  const { projectId } = params;
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [t] = useTranslation();

  // 定义获取数据的函数
  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取所有项目
      // 从 localStorage 获取项目 ID 数组
      const userProjectIds = JSON.parse(localStorage.getItem('userProjects') || '[]');

      if (userProjectIds.length === 0) {
        // 如果没有保存的项目，直接设置为空数组
        setProjects([]);
        setLoading(false);
        return;
      }

      // 获取用户创建的项目详情
      const projectsResponse = await fetch(`/api/projects?projectIds=${userProjectIds.join(',')}`);
      if (!projectsResponse.ok) {
        throw new Error(t('projects.fetchFailed'));
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // 获取当前项目详情
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        // 如果项目不存在，跳转到首页
        if (projectResponse.status === 404) {
          router.push('/');
          return;
        }
        throw new Error('获取项目详情失败');
      }
      const projectData = await projectResponse.json();
      setCurrentProject(projectData);

      // 获取当前项目的模型配置
      const modelsResponse = await fetch(`/api/projects/${projectId}/models`);
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        if (modelsData && modelsData.length > 0) {
          // 将 API 返回的模型配置转换为 Navbar 需要的格式
          const formattedModels = modelsData.map(model => ({
            id: `${model.name}-${model.providerId}`,
            provider: model.provider,
            name: model.name,
            ...model
          }));
          setModels(formattedModels);

          // 更新 localStorage 中的模型信息
          if (formattedModels.length > 0) {
            const selectedModelId = localStorage.getItem('selectedModelId');
            // 通知用户：如果之前选择的模型不在当前模型列表中，则使用第一个模型
            // const modelExists = selectedModelId && formattedModels.some(m => m.id === selectedModelId);
            // if (!modelExists) {
            //   const defaultModel = formattedModels[0];
            //   localStorage.setItem('selectedModelId', defaultModel.id);
            //   localStorage.setItem('selectedModelInfo', JSON.stringify(defaultModel));
            // }
          }
        }
      } else {
        console.warn('获取模型配置失败，使用默认配置');
        // 如果项目有旧的模型配置，使用项目的模型配置
        if (projectData.modelConfig && projectData.modelConfig.provider) {
          const customModel = {
            id: `${projectData.modelConfig.modelName}-${projectData.modelConfig.provider.toLowerCase()}`,
            provider: projectData.modelConfig.provider,
            name: projectData.modelConfig.modelName
          };
          setModels([customModel]);
        }
      }

    } catch (error) {
      console.error('加载项目数据出错:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    // 如果 projectId 是 undefined 或 "undefined"，直接重定向到首页
    if (!projectId || projectId === "undefined") {
      router.push('/');
      return;
    }
    
    fetchData();
  }, [projectId, router]);

  // 监听模型配置变化的事件
  useEffect(() => {
    // 创建一个自定义事件监听器，用于在模型配置变化时刷新数据
    const handleModelConfigChange = () => {
      console.log('检测到模型配置变化，重新获取模型数据');
      // 使用一个标志来防止无限循环
      fetchModelData();
    };

    // 监听模型选择变化的事件
    const handleModelSelectionChange = () => {
      console.log('检测到模型选择变化');
      // 如果需要在模型选择变化时执行特定操作，可以在这里添加
      // 例如更新当前选中的模型或其他状态
    };

    // 添加事件监听器
    window.addEventListener('model-config-changed', handleModelConfigChange);
    window.addEventListener('model-selection-changed', handleModelSelectionChange);

    // 清理函数
    return () => {
      window.removeEventListener('model-config-changed', handleModelConfigChange);
      window.removeEventListener('model-selection-changed', handleModelSelectionChange);
    };
  }, [projectId]);

  // 只获取模型数据，不获取项目数据，避免不必要的渲染
  const fetchModelData = async () => {
    try {
      const modelsResponse = await fetch(`/api/projects/${projectId}/models`);
      if (!modelsResponse.ok) {
        throw new Error('获取模型数据失败');
      }

      const modelsData = await modelsResponse.json();
      if (modelsData && modelsData.length > 0) {
        // 将 API 返回的模型配置转换为 Navbar 需要的格式
        const formattedModels = modelsData.map(model => ({
          id: `${model.name}-${model.providerId}`,
          provider: model.provider,
          name: model.name,
          ...model
        }));

        setModels(formattedModels);

        // 更新 localStorage 中的模型信息
        if (formattedModels.length > 0) {
          const selectedModelId = localStorage.getItem('selectedModelId');
          const modelExists = selectedModelId && formattedModels.some(m => m.id === selectedModelId);

          // if (!modelExists) {
          //   const defaultModel = formattedModels[0];
          //   localStorage.setItem('selectedModelId', defaultModel.id);
          //   localStorage.setItem('selectedModelInfo', JSON.stringify(defaultModel));
          //   // 不设置 error 状态，避免触发重新渲染
          //   console.log('之前选择的模型不存在，使用第一个模型');
          // }
        }
      }
    } catch (error) {
      console.error('获取模型数据出错:', error);
      // 不设置 error 状态，避免触发重新渲染
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>加载项目数据...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography color="error">{t('projects.fetchFailed')}: {error}</Typography>
        <Button variant="contained" onClick={() => router.push('/')} sx={{ mt: 2 }}>
          {t('projects.backToHome')}
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Navbar
        projects={projects}
        currentProject={projectId}
        models={models}
      />
      <main>{children}</main>
    </>
  );
}