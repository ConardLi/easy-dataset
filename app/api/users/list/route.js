import { db } from '@/lib/db/index';
import { checkIsAdmin } from '@/lib/auth';

export async function GET() {
  try {
    // 检查是否为管理员
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return Response.json({ error: '无权查看用户列表' }, { status: 403 });
    }

    const users = await db.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createAt: true
      },
      orderBy: {
        createAt: 'desc'
      }
    });

    return Response.json(users);
  } catch (error) {
    console.error('获取用户列表出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

