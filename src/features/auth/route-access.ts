import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';

export function authorizeRouteAccess({
  auth,
  request,
}: {
  auth: Session | null;
  request: NextRequest;
}) {
  const isServerActionRequest =
    request.method === 'POST' && request.headers.get('next-action') !== null;
  if (isServerActionRequest) {
    return true;
  }

  const { nextUrl } = request;
  const user = auth?.user;
  const isOnLoginPage = nextUrl.pathname === '/login';
  const isLoggedIn = !!user;
  const { pathname } = nextUrl;
  const isPublicPage = pathname === '/login';
  const isOnSessionClearPage = nextUrl.pathname === '/session/clear';
  const isOnAdminRoute =
    nextUrl.pathname === '/admin' || nextUrl.pathname.startsWith('/admin/');

  if (user?.deletedAt) {
    if (isOnSessionClearPage) return true;
    return Response.redirect(new URL('/session/clear', nextUrl));
  }

  if (isLoggedIn && isPublicPage) {
    return Response.redirect(new URL('/', nextUrl));
  }

  if (isOnLoginPage) {
    if (user) return Response.redirect(new URL('/', nextUrl));
    return true;
  }

  if (!user) {
    return Response.redirect(new URL('/login', nextUrl));
  }

  if (isOnAdminRoute && user.role !== 'ADMIN') {
    return Response.redirect(new URL('/', nextUrl));
  }

  return true;
}
