'use server';

import fs from 'fs';
import path from 'path';
import { getProjectRoot, ensureDbExists, readJsonFile, writeJsonFile } from './base';
import { DEFAULT_SETTINGS } from '@/constant/setting';

// 创建新项目
export async function createProject(projectData) {
  await ensureDbExists();

  const projectId = Date.now().toString();
  const projectRoot = await getProjectRoot();
  const projectDir = path.join(projectRoot, projectId);

  // 创建项目目录
  await fs.promises.mkdir(projectDir, { recursive: true });

  // 创建子目录
  await fs.promises.mkdir(path.join(projectDir, 'files'), { recursive: true }); // 原始文件
  await fs.promises.mkdir(path.join(projectDir, 'chunks'), { recursive: true }); // 分割后的文本片段

  // 创建项目配置文件
  const configPath = path.join(projectDir, 'config.json');
  await writeJsonFile(configPath, projectData);

  // 创建空的问题列表文件
  const questionsPath = path.join(projectDir, 'questions.json');
  await writeJsonFile(questionsPath, []);

  // 创建空的标签树文件
  const tagsPath = path.join(projectDir, 'tags.json');
  await writeJsonFile(tagsPath, []);

  // 创建空的数据集结果文件
  const datasetsPath = path.join(projectDir, 'datasets.json');
  await writeJsonFile(datasetsPath, []);

  if (projectData.modelConfig) {
    const modelConfigPath = path.join(projectDir, 'model-config.json');
    await writeJsonFile(modelConfigPath, projectData.modelConfig);
  }

  return { id: projectId, ...projectData };
}

// 获取所有项目
export async function getProjects() {
  await ensureDbExists();

  const projects = [];

  // 读取所有项目目录
  const projectRoot = await getProjectRoot();
  const items = await fs.promises.readdir(projectRoot);

  for (const item of items) {
    const projectPath = path.join(projectRoot, item);
    const stat = await fs.promises.stat(projectPath);

    if (stat.isDirectory()) {
      const configPath = path.join(projectPath, 'config.json');
      const configData = await readJsonFile(configPath);

      if (configData) {
        projects.push({
          id: item,
          ...configData
        });
      }
    }
  }

  return projects;
}

// 获取项目详情
export async function getProject(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const configPath = path.join(projectPath, 'config.json');

  const configData = await readJsonFile(configPath);
  if (!configData) {
    return null;
  }

  return {
    id: projectId,
    ...configData
  };
}

export async function getProjectModelConfig(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const modelConfigPath = path.join(projectPath, 'model-config.json');
  const modelConfigData = await readJsonFile(modelConfigPath);
  return modelConfigData;
}



// 更新项目配置
export async function updateProject(projectId, projectData) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const configPath = path.join(projectPath, 'config.json');

  await writeJsonFile(configPath, projectData);
  return {
    id: projectId,
    ...projectData
  };
}

// 删除项目
export async function deleteProject(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);

  try {
    await fs.promises.rm(projectPath, { recursive: true });
    return true;
  } catch (error) {
    return false;
  }
}

// 获取任务配置
export async function getTaskConfig(projectId) {
  const projectRoot = await getProjectRoot();
  const projectPath = path.join(projectRoot, projectId);
  const taskConfigPath = path.join(projectPath, 'task-config.json');
  const taskData = await readJsonFile(taskConfigPath);
  if (!taskData) {
    return DEFAULT_SETTINGS;
  }
  return taskData;
}
