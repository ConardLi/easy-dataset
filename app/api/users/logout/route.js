import { cookies } from 'next/headers';

const USER_ID_COOKIE = 'user_id';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // 删除当前用户cookie
    cookieStore.delete(USER_ID_COOKIE);
    
    return Response.json({ 
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    console.error('退出登录出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

