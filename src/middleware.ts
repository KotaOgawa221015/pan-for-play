// src/middleware.ts (新規作成)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('pancolle_session');
  const { pathname } = request.nextUrl;

  // 1. 未ログインで、ログイン/サインアップページ以外にアクセスした場合
  if (!session && pathname !== '/login' && pathname !== '/signup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. ログイン済みで、ログイン/サインアップページにアクセスした場合
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 静的ファイル（画像など）以外にミドルウェアを適用
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};