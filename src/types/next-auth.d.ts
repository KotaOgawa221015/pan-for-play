import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      deletedAt: Date | null;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string | null;
    deletedAt?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string | null;
    deletedAt?: Date | null;
  }
}
