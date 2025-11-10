import { getOrCreateDefaultAdmin } from '@/lib/db/users';
import { db } from '@/lib/db/index';
import { setCurrentUserId } from '@/lib/auth';

/**
 * 初始化用户体系
 * 创建默认管理员账户并将现有项目分配给它
 */
export async function POST(request) {
  try {
    // 获取或创建默认管理员账户
    const adminUser = await getOrCreateDefaultAdmin();
    console.log(`默认管理员账户: ${adminUser.username}, ID: ${adminUser.id}`);
    
    // 查找所有没有userId的项目
    const projectsWithoutUser = await db.projects.findMany({
      where: {
        userId: null
      }
    });
    
    console.log(`找到 ${projectsWithoutUser.length} 个未分配用户的项目`);
    
    // 更新所有项目，分配默认管理员
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
    
    // 设置当前用户为默认管理员
    await setCurrentUserId(adminUser.id);
    
    return Response.json({
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      },
      migratedCount: projectsWithoutUser.length
    });
  } catch (error) {
    console.error('初始化用户体系失败:', error);
    return Response.json({ 
      error: String(error),
      success: false 
    }, { status: 500 });
  }
}

