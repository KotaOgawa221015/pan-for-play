import NextAuth from 'next-auth';
import { authConfig } from '@/features/auth/auth.config';

export default NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'development-only-secret'
      : undefined),
  ...authConfig,
}).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
