'use server';

import { getProject } from '@/lib/db/projects';
import { canAccessProject } from './index';

/**
 * 检查用户是否有权限访问指定项目
 * @param {string} projectId - 项目ID
 * @returns {Promise<{hasAccess: boolean, project: object|null, error: string|null}>}
 */
export async function checkProjectAccess(projectId) {
  try {
    const project = await getProject(projectId);
    
    if (!project) {
      return {
        hasAccess: false,
        project: null,
        error: '项目不存在'
      };
    }
    
    const hasAccess = await canAccessProject(project.userId);
    
    if (!hasAccess) {
      return {
        hasAccess: false,
        project: project,
        error: '无权访问该项目'
      };
    }
    
    return {
      hasAccess: true,
      project: project,
      error: null
    };
  } catch (error) {
    console.error('检查项目权限失败:', error);
    return {
      hasAccess: false,
      project: null,
      error: '检查权限时出错'
    };
  }
}

