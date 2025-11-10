'use server';

import { cookies } from 'next/headers';
import { getUserById, isAdmin } from '@/lib/db/users';

const USER_ID_COOKIE = 'user_id';
const DEFAULT_USER_ID = 'admin'; // 默认管理员用户名，用于桌面应用

// 获取当前用户ID（从cookie获取，如果没有则返回null）
export async function getCurrentUserId() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(USER_ID_COOKIE)?.value;
    
    // 如果没有cookie，返回null（需要登录）
    return userId || null;
  } catch (error) {
    console.error('Failed to get current user id:', error);
    return null;
  }
}

// 设置当前用户ID
export async function setCurrentUserId(userId) {
  try {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    // 检查是否使用 HTTPS（通过环境变量或请求头）
    const isHttps = process.env.NEXT_PUBLIC_HTTPS === 'true' || 
                    process.env.HTTPS === 'true';
    
    // 获取域名配置（如果设置了环境变量）
    // 例如：.dataste.com 表示所有子域名共享 cookie
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    
    cookieStore.set(USER_ID_COOKIE, userId, {
      httpOnly: true,
      secure: isProduction || isHttps, // 生产环境或 HTTPS 时启用 secure
      sameSite: 'lax', // 使用 lax 以支持跨站请求
      maxAge: 60 * 60 * 24 * 365, // 1年
      path: '/', // 确保 cookie 在整个站点可用
      ...(cookieDomain && { domain: cookieDomain }) // 如果设置了域名，则使用该域名
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

