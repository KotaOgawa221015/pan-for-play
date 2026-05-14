import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/features/auth/session-cookie';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  const url = new URL('/login', request.url);
  url.searchParams.set('msg', 'session_invalid');

  return NextResponse.redirect(url);
}
