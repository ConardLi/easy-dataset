'use server';

import fs from 'fs';
import path from 'path';
import { getProjectRoot, readJsonFile } from './base';
import { DEFAULT_SETTINGS } from '@/constant/setting';
import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';

// 创建新项目
export async function createProject(projectData, userId) {
  try {
    let projectId = nanoid(12);
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
        userId: userId
      }
    });
  } catch (error) {
    console.error('Failed to create project in database');
    throw error;
  }
}

export async function isExistByName(name, userId, isAdmin = false) {
  try {
    const where = isAdmin 
      ? { name } 
      : { name, userId };
    
    const count = await db.projects.count({ where });
    return count > 0;
  } catch (error) {
    console.error('Failed to get project by name in database');
    throw error;
  }
}

// 获取所有项目（根据用户权限过滤）
export async function getProjects(userId, isAdmin = false) {
  try {
    const where = isAdmin ? {} : { userId };
    
    return await db.projects.findMany({
      where,
      include: {
        _count: {
          select: {
            Datasets: true,
            Questions: true
          }
        }
      },
      orderBy: {
        createAt: 'desc'
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
    return await db.projects.findUnique({ 
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get project by id in database');
    throw error;
  }
}

// 更新项目配置
export async function updateProject(projectId, projectData) {
  try {
    delete projectData.projectId;
    return await db.projects.update({
      where: { id: projectId },
      data: { ...projectData }
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
