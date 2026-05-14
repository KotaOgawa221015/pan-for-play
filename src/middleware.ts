// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/features/auth/auth.config";

// auth.config.ts (Adapterを含まない設定) を使って初期化
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};