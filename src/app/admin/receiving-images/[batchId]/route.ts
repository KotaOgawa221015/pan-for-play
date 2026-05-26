import { auth } from '@/features/account/auth';
import { requireAdminUser } from '@/features/account/session-user';
import { readStoredDeliveryNoteImage } from '@/features/receiving/delivery-note/read-stored-image';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const session = await auth();

  if (!session) {
    return new Response(null, { status: 401 });
  }

  await requireAdminUser();

  const { batchId } = await params;
  const storedImage = await readStoredDeliveryNoteImage(batchId);

  if (!storedImage) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(storedImage.imageBuffer), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': storedImage.mimeType,
    },
  });
}
