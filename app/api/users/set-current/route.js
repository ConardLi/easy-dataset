import { setCurrentUserId } from '@/lib/auth';
import { getUserById } from '@/lib/db/users';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return Response.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    // 验证用户是否存在
    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 设置当前用户
    await setCurrentUserId(userId);

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
    console.error('设置当前用户出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

