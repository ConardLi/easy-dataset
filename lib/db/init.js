'use server';

import { getOrCreateDefaultAdmin } from './users';
import { db } from '@/lib/db/index';

const globalState = globalThis.__HKGAI_DB_INIT__ || {
  initialized: false,
  initializingPromise: null,
  adminUser: null
};

if (!globalThis.__HKGAI_DB_INIT__) {
  globalThis.__HKGAI_DB_INIT__ = globalState;
}

/**
 * 初始化数据库和默认管理员账户
 * 在应用启动时自动调用
 */
export async function initializeDatabase() {
  if (globalState.initialized && globalState.adminUser) {
    return globalState.adminUser;
  }

  if (globalState.initializingPromise) {
    return globalState.initializingPromise;
  }

  globalState.initializingPromise = (async () => {
    try {
      const adminUser = await getOrCreateDefaultAdmin();
      console.log('数据库初始化完成，默认管理员账户:', adminUser.username);
      
      globalState.initialized = true;
      globalState.adminUser = adminUser;
      return adminUser;
    } catch (error) {
      if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
        console.log('admin用户已存在，跳过创建');
        try {
          const { getUserByUsername } = await import('./users');
          const adminUser = await getUserByUsername('admin');
          if (adminUser) {
            globalState.initialized = true;
            globalState.adminUser = adminUser;
            return adminUser;
          }
        } catch (getError) {
          console.error('获取admin用户失败:', getError);
        }
      } else {
        console.error('数据库初始化失败:', error);
      }
      return null;
    } finally {
      globalState.initializingPromise = null;
    }
  })();

  return globalState.initializingPromise;
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
