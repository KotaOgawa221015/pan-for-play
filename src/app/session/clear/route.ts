import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  cookieStore.delete('authjs.session-token');
  cookieStore.delete('__Secure-authjs.session-token');
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');

  const url = new URL('/login', request.url);
  url.searchParams.set('msg', 'session_invalid');

  return NextResponse.redirect(url);
}

export async function GET(_request: Request) {
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
