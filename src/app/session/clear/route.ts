import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/features/auth/session-cookie';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // 旧カスタムセッションクッキーの削除
  cookieStore.delete(SESSION_COOKIE_NAME);

  // NextAuth v5 (Auth.js) のクッキーを削除
  cookieStore.delete('authjs.session-token');
  cookieStore.delete('__Secure-authjs.session-token');
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');

  const url = new URL('/login', request.url);
  url.searchParams.set('msg', 'session_invalid');

  return NextResponse.redirect(url);
}

export async function GET(_request: Request) {
  // GETは画面を表示するだけ（サイドエフェクトなし）
  // 自動的にPOSTするようにスクリプトを仕込む
  return new Response(
    `
    <html>
      <body>
        <p>セッションをクリアしています...</p>
        <form id="clear-form" action="/session/clear" method="POST"></form>
        <script>document.getElementById('clear-form').submit();</script>
      </body>
    </html>
    `,
    {
      headers: { 'Content-Type': 'text/html' },
    },
  );
}
