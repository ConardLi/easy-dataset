'use server';

import { getOrCreateDefaultAdmin } from './users';
import { db } from '@/lib/db/index';

let initialized = false;

/**
 * 初始化数据库和默认管理员账户
 * 在应用启动时自动调用
 */
export async function initializeDatabase() {
  if (initialized) {
    return;
  }

  try {
    // 确保默认管理员账户存在
    const adminUser = await getOrCreateDefaultAdmin();
    console.log('数据库初始化完成，默认管理员账户:', adminUser.username);
    
    initialized = true;
    return adminUser;
  } catch (error) {
    // 如果是唯一约束错误，说明用户已存在，这是正常的
    if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
      console.log('admin用户已存在，跳过创建');
      try {
        const { getUserByUsername } = await import('./users');
        const adminUser = await getUserByUsername('admin');
        if (adminUser) {
          initialized = true;
          return adminUser;
        }
      } catch (getError) {
        console.error('获取admin用户失败:', getError);
      }
    } else {
      console.error('数据库初始化失败:', error);
    }
    // 不抛出错误，允许应用继续运行
    return null;
  }
}

/**
 * 迁移现有项目到默认管理员
 */
export async function migrateProjectsToAdmin() {
  try {
    const adminUser = await getOrCreateDefaultAdmin();
    
    // 查找所有没有userId的项目
    const projectsWithoutUser = await db.projects.findMany({
      where: {
        userId: null
      }
    });
    
    if (projectsWithoutUser.length > 0) {
      await db.projects.updateMany({
        where: {
          userId: null
        },
        data: {
          userId: adminUser.id
        }
      });
      console.log(`已将 ${projectsWithoutUser.length} 个项目分配给默认管理员`);
    }
    
    return projectsWithoutUser.length;
  } catch (error) {
    console.error('迁移项目失败:', error);
    throw error;
  }
}

