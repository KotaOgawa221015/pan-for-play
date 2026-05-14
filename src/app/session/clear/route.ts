import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/features/auth/session-cookie';

export async function GET(request: Request) {
  const cookieStore = await cookies();

  // 旧カスタムセッションクッキーの削除
  cookieStore.delete(SESSION_COOKIE_NAME);

  // NextAuth v5 (Auth.js) のクッキーを削除
  // 本番環境と開発環境の両方の可能性を考慮
  cookieStore.delete('authjs.session-token');
  cookieStore.delete('__Secure-authjs.session-token');
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');

  const url = new URL('/login', request.url);
  url.searchParams.set('msg', 'session_invalid');

  return NextResponse.redirect(url);
}
