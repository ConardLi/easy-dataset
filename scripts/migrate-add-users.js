'use server';

import { db } from '@/lib/db/index';
import { getOrCreateDefaultUser } from '@/lib/db/users';

/**
 * 迁移脚本：为现有项目添加用户关联
 * 将所有现有项目分配给默认用户
 */
async function migrateAddUsers() {
  try {
    console.log('开始迁移：添加用户体系...');
    
    // 获取或创建默认用户
    const defaultUser = await getOrCreateDefaultUser();
    console.log(`默认用户ID: ${defaultUser.id}`);
    
    // 查找所有没有userId的项目
    const projectsWithoutUser = await db.projects.findMany({
      where: {
        userId: null
      }
    });
    
    console.log(`找到 ${projectsWithoutUser.length} 个未分配用户的项目`);
    
    // 更新所有项目，分配默认用户
    if (projectsWithoutUser.length > 0) {
      await db.projects.updateMany({
        where: {
          userId: null
        },
        data: {
          userId: defaultUser.id
        }
      });
      console.log(`已将 ${projectsWithoutUser.length} 个项目分配给默认用户`);
    }
    
    console.log('迁移完成！');
    return { success: true, migratedCount: projectsWithoutUser.length };
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAddUsers()
    .then(result => {
      console.log('迁移结果:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('迁移错误:', error);
      process.exit(1);
    });
}

export { migrateAddUsers };

