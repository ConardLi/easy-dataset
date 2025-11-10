import { cookies } from 'next/headers';

const USER_ID_COOKIE = 'user_id';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = process.env.NEXT_PUBLIC_HTTPS === 'true';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    
    // 删除当前用户cookie，使用与设置时相同的配置
    cookieStore.set(USER_ID_COOKIE, '', {
      httpOnly: true,
      secure: isProduction || isHttps,
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/',
      ...(cookieDomain && { domain: cookieDomain })
    });
    
    return Response.json({ 
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    console.error('退出登录出错:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

