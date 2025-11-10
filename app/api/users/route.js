import { createUser, getUserByUsername, getUserById } from '@/lib/db/users';
import { getCurrentUserId, checkIsAdmin } from '@/lib/auth';

// 创建用户（仅管理员可以创建）
export async function POST(request) {
  try {
    // 检查是否为管理员
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return Response.json({ error: '只有管理员可以创建用户' }, { status: 403 });
    }

    const userData = await request.json();
    
    // 验证必要字段
    if (!userData.username) {
      return Response.json({ error: '用户名不能为空' }, { status: 400 });
    }

    // 禁止创建admin用户（已存在）
    if (userData.username.toLowerCase() === 'admin') {
      return Response.json({ error: '不能创建admin用户，该账户已存在' }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUser = await getUserByUsername(userData.username);
    if (existingUser) {
      return Response.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 创建用户
    const newUser = await createUser({
      username: userData.username,
      email: userData.email || null,
      password: userData.password || null,
      role: userData.role || 'user'
    });

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    const friendlyError = handleUniqueConstraintError(error);
    if (friendlyError) {
      return friendlyError;
    }
    console.error('创建用户出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// 获取当前用户信息
export async function GET(request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 不返回敏感信息
    const { id, username, email, role, createAt } = user;
    return Response.json({ id, username, email, role, createAt });
  } catch (error) {
    console.error('获取用户信息出错:', String(error));
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
