import { getUserById, getUserByUsername } from '@/lib/db/users';
import { db } from '@/lib/db/index';
import { getCurrentUserId, checkIsAdmin } from '@/lib/auth';

// 获取用户详情
export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const currentUserId = await getCurrentUserId();
    const isAdmin = await checkIsAdmin();
    
    // 只能查看自己的信息，或者管理员可以查看任何人的信息
    if (currentUserId !== userId && !isAdmin) {
      return Response.json({ error: '无权查看该用户信息' }, { status: 403 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 不返回密码
    const { password, ...userData } = user;
    return Response.json(userData);
  } catch (error) {
    console.error('获取用户详情出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// 更新用户
export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const isAdmin = await checkIsAdmin();
    
    if (!isAdmin) {
      return Response.json({ error: '只有管理员可以修改用户' }, { status: 403 });
    }

    const userData = await request.json();
    const existingUser = await getUserById(userId);
    
    if (!existingUser) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 禁止修改admin用户名
    if (existingUser.username === 'admin' && userData.username !== 'admin') {
      return Response.json({ error: '不能修改admin用户名' }, { status: 400 });
    }

    // 如果修改了用户名，检查是否重复
    if (userData.username && userData.username !== existingUser.username) {
      const duplicateUser = await getUserByUsername(userData.username);
      if (duplicateUser) {
        return Response.json({ error: '用户名已存在' }, { status: 400 });
      }
    }

    // 构建更新数据
    const updateData = {};
    if (userData.username) updateData.username = userData.username;
    if (userData.email !== undefined) updateData.email = userData.email || null;
    if (userData.password) {
      updateData.password = userData.password; // 实际应用中应该加密
      updateData.needChangePassword = false; // 设置密码后，不再需要强制修改
    }
    if (userData.role) updateData.role = userData.role;
    if (userData.needChangePassword !== undefined) updateData.needChangePassword = userData.needChangePassword;

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: updateData
    });

    // 不返回密码
    const { password, ...userDataWithoutPassword } = updatedUser;
    return Response.json(userDataWithoutPassword);
  } catch (error) {
    const friendlyError = handleUniqueConstraintError(error);
    if (friendlyError) {
      return friendlyError;
    }
    console.error('更新用户出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(request, { params }) {
  try {
    const { userId } = params;
    const isAdmin = await checkIsAdmin();
    
    if (!isAdmin) {
      return Response.json({ error: '只有管理员可以删除用户' }, { status: 403 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 禁止删除admin用户
    if (user.username === 'admin') {
      return Response.json({ error: '不能删除admin用户' }, { status: 400 });
    }

    // 检查用户是否有项目
    const projectCount = await db.projects.count({
      where: { userId: userId }
    });

    if (projectCount > 0) {
      return Response.json({ 
        error: `该用户有 ${projectCount} 个项目，无法删除。请先转移或删除这些项目。` 
      }, { status: 400 });
    }

    await db.users.delete({
      where: { id: userId }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('删除用户出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

function handleUniqueConstraintError(error) {
  if (error?.code !== 'P2002') {
    return null;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target : [target];
  const normalizedTargets = fields
    .filter(Boolean)
    .map((field) => field.toString().toLowerCase());

  if (normalizedTargets.some((field) => field.includes('email'))) {
    return Response.json({ error: '该邮箱已被使用，请更换一个邮箱' }, { status: 400 });
  }

  if (normalizedTargets.some((field) => field.includes('username'))) {
    return Response.json({ error: '用户名已存在' }, { status: 400 });
  }

  return Response.json({ error: '字段值已存在，请检查输入信息' }, { status: 400 });
}
