import NextAuth from "next-auth";
import { authConfig } from "@/features/auth/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

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