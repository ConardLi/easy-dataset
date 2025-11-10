'use server';

import { cookies } from 'next/headers';
import { getUserById, isAdmin } from '@/lib/db/users';

const USER_ID_COOKIE = 'user_id';
const DEFAULT_USER_ID = 'admin'; // 默认管理员用户名，用于桌面应用

// 获取当前用户ID（从cookie或使用默认值）
export async function getCurrentUserId() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(USER_ID_COOKIE)?.value;
    
    // 如果没有cookie，返回默认管理员ID（桌面应用场景）
    // 注意：需要确保默认管理员已创建
    if (!userId) {
      // 尝试获取或创建默认管理员
      try {
        const { getOrCreateDefaultAdmin } = await import('@/lib/db/users');
        const adminUser = await getOrCreateDefaultAdmin();
        return adminUser.id;
      } catch (error) {
        console.error('Failed to get default admin:', error);
        return 'admin'; // 返回默认用户名，后续会通过用户名查找
      }
    }
    
    return userId;
  } catch (error) {
    console.error('Failed to get current user id:', error);
    // 如果出错，尝试返回默认管理员
    try {
      const { getOrCreateDefaultAdmin } = await import('@/lib/db/users');
      const adminUser = await getOrCreateDefaultAdmin();
      return adminUser.id;
    } catch (err) {
      return 'admin'; // 返回默认用户名
    }
  }
}

// 设置当前用户ID
export async function setCurrentUserId(userId) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(USER_ID_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1年
    });
  } catch (error) {
    console.error('Failed to set current user id:', error);
  }
}

// 获取当前用户信息
export async function getCurrentUser() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }
    
    return await getUserById(userId);
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// 检查当前用户是否为管理员
export async function checkIsAdmin() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return false;
    }
    
    return await isAdmin(userId);
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
}

// 检查用户是否有权限访问项目
export async function canAccessProject(projectUserId) {
  try {
    const currentUserId = await getCurrentUserId();
    const isUserAdmin = await checkIsAdmin();
    
    // 管理员可以访问所有项目
    if (isUserAdmin) {
      return true;
    }
    
    // 普通用户只能访问自己的项目
    return currentUserId === projectUserId;
  } catch (error) {
    console.error('Failed to check project access:', error);
    return false;
  }
}

