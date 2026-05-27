import { runRetentionCleanup } from '@/features/retention/cleanup';
import { getCronSecret } from '@/lib/environment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const authorization = request.headers.get('authorization');
  const cronSecret = getCronSecret();
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      { ok: false, error: 'Unauthorized' },
      {
        status: 401,
      },
    );
  }

  const result = await runRetentionCleanup();
  return Response.json({
    ok: true,
    ...result,
  });
}
