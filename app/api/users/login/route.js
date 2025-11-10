import { getUserByUsername } from '@/lib/db/users';

export async function POST(request) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return Response.json({ error: '用户名不能为空' }, { status: 400 });
    }

    // 查找用户
    const user = await getUserByUsername(username.trim());
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

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

