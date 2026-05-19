import path from 'node:path';
import { z } from 'zod';

const MAX_DELIVERY_NOTE_BYTES = 5 * 1024 * 1024;

const deliveryNoteUploadSchema = z
  .object({
    file: z.instanceof(File, {
      message: '納品書画像を取得できませんでした。',
    }),
  })
  .superRefine((data, ctx) => {
    const fileName = data.file.name.trim();

    if (!fileName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '納品書画像のファイル名を取得できませんでした。',
        path: ['file'],
      });
      return;
    }

    if (path.extname(fileName).toLowerCase() !== '.png') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '納品書画像は PNG のみ対応しています。',
        path: ['file'],
      });
    }

    if (data.file.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '空の画像ファイルは読み取れません。',
        path: ['file'],
      });
    }

    if (data.file.size > MAX_DELIVERY_NOTE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '納品書画像は 5MB 以下でアップロードしてください。',
        path: ['file'],
      });
    }
  });

export async function readDeliveryNoteUpload(formData: FormData): Promise<{
  fileName: string;
  imageBuffer: Buffer;
}> {
  const parsed = deliveryNoteUploadSchema.safeParse({
    file: formData.get('file'),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? '納品書画像を取得できませんでした。');
  }

  const fileEntry = parsed.data.file;
  const fileName = fileEntry.name.trim();

  return {
    fileName,
    imageBuffer: Buffer.from(await fileEntry.arrayBuffer()),
  };
}
