import { auth } from '@/features/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedin = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isLoggedin && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedin && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
