import { getUserByUsername } from '@/lib/db/users';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username) {
      return Response.json({ error: '用户名不能为空' }, { status: 400 });
    }

    // 查找用户
    const user = await getUserByUsername(username.trim());
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 如果用户设置了密码，则验证密码
    if (user.password) {
      if (!password) {
        return Response.json({ error: '请输入密码' }, { status: 400 });
      }
      // 简单密码比较（实际应用中应该使用加密比较，如bcrypt）
      if (user.password !== password) {
        return Response.json({ error: '密码错误' }, { status: 401 });
      }
    }
    // 如果用户没有设置密码，则允许直接登录（向后兼容）

    return Response.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

