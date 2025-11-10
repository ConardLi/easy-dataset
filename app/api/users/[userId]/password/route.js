import { getUserById } from '@/lib/db/users';
import { db } from '@/lib/db/index';
import { getCurrentUserId, checkIsAdmin } from '@/lib/auth';

// 修改密码
export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const { currentPassword, newPassword } = await request.json();
    
    const currentUserId = await getCurrentUserId();
    const isAdmin = await checkIsAdmin();
    const isSelf = currentUserId === userId;
    
    // 只能修改自己的密码，或者管理员可以修改任何人的密码
    if (!isSelf && !isAdmin) {
      return Response.json({ error: '无权修改该用户的密码' }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 6) {
      return Response.json({ error: '新密码长度至少为6位' }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    const needsPasswordVerification =
      Boolean(user.password) && (isSelf || !isAdmin) && !user.needChangePassword;
    if (needsPasswordVerification) {
      if (!currentPassword) {
        return Response.json({ error: '请输入当前密码' }, { status: 400 });
      }
      if (user.password !== currentPassword) {
        return Response.json({ error: '当前密码错误' }, { status: 401 });
      }
    }

    // 更新密码
    await db.users.update({
      where: { id: userId },
      data: {
        password: newPassword,
        needChangePassword: false // 修改密码后，不再需要强制修改
      }
    });

    return Response.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
