'use server';

import { db } from '@/lib/db/index';
import { nanoid } from 'nanoid';

// 创建用户
export async function createUser(userData) {
  try {
    const userId = nanoid(12);
    return await db.users.create({
      data: {
        id: userId,
        username: userData.username,
        email: userData.email || null,
        role: userData.role || 'user'
      }
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

// 根据用户名获取用户
export async function getUserByUsername(username) {
  try {
    return await db.users.findUnique({
      where: { username }
    });
  } catch (error) {
    console.error('Failed to get user by username in database');
    throw error;
  }
}

// 根据ID获取用户
export async function getUserById(userId) {
  try {
    return await db.users.findUnique({
      where: { id: userId }
    });
  } catch (error) {
    console.error('Failed to get user by id in database');
    throw error;
  }
}

// 检查用户是否为管理员
export async function isAdmin(userId) {
  try {
    const user = await getUserById(userId);
    return user && user.role === 'admin';
  } catch (error) {
    console.error('Failed to check admin status');
    return false;
  }
}

// 获取或创建默认管理员账户
export async function getOrCreateDefaultAdmin() {
  try {
    // 先尝试获取现有用户
    let admin = await getUserByUsername('admin');
    if (admin) {
      return admin;
    }

    // 如果不存在，尝试创建
    try {
      admin = await createUser({
        username: 'admin',
        role: 'admin'
      });
      console.log('已创建默认管理员账户: admin');
      return admin;
    } catch (createError) {
      // 如果是唯一约束冲突（用户已存在），再次尝试获取
      if (createError.code === 'P2002' || createError.message?.includes('Unique constraint')) {
        console.log('admin用户已存在，重新获取...');
        admin = await getUserByUsername('admin');
        if (admin) {
          return admin;
        }
      }
      // 其他错误继续抛出
      throw createError;
    }
  } catch (error) {
    console.error('Failed to get or create default admin:', error);
    throw error;
  }
}

// 获取或创建默认用户（用于迁移现有数据，已废弃，使用getOrCreateDefaultAdmin）
export async function getOrCreateDefaultUser() {
  return await getOrCreateDefaultAdmin();
}

