'use server';

import fs from 'fs';
import path from 'path';
import { getProjectRoot, readJsonFile } from './base';
import { DEFAULT_SETTINGS } from '@/constant/setting';
import { db } from '@/lib/db/index';
import { v4 as uuidv4 } from 'uuid';

// 创建新项目
export async function createProject(projectData) {
  try {
    let projectId = uuidv4();
    const projectRoot = await getProjectRoot();
    const projectDir = path.join(projectRoot, projectId);
    // 创建项目目录
    await fs.promises.mkdir(projectDir, { recursive: true });
    // 创建子目录
    await fs.promises.mkdir(path.join(projectDir, 'files'), { recursive: true }); // 原始文件
    return await db.projects.create({
      data: {
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        reuseConfigFrom: JSON.stringify(projectData.reuseConfigFrom || []),
        uploadedFiles: JSON.stringify(projectData.uploadedFiles || [])
      }
    });
  } catch (error) {
    console.error('Failed to create project in database');
    throw error;
  }
}

export async function isExistByName(name) {
  try {
    const count = await db.projects.count({
      where: {
        name: name
      }
    });
    return count > 0;
  } catch (error) {
    console.error('Failed to get project by name in database');
    throw error;
  }
}

// 获取所有项目
export async function getProjects() {
  try {
    return await db.projects.findMany({
      include: {
        _count: {
          select: {
            Datasets: true,
            Questions: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get projects in database');
    throw error;
  }
}

// 获取项目详情
export async function getProject(projectId) {
  try {
    return await db.projects.findUnique({ where: { id: projectId } });
  } catch (error) {
    console.error('Failed to get project by id in database');
    throw error;
  }
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
  try {
    return await db.projects.update({
      where: { id: projectId },
      data: { ...projectData, uploadedFiles: JSON.stringify(projectData.uploadedFiles || []) }
    });
  } catch (error) {
    console.error('Failed to update project in database');
    throw error;
  }
}

// 删除项目
export async function deleteProject(projectId) {
  try {
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    await db.projects.delete({ where: { id: projectId } });
    if (fs.existsSync(projectPath)) {
      await fs.promises.rm(projectPath, { recursive: true });
    }
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
