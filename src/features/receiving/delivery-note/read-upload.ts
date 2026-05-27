import { z } from 'zod';
import { convertHeicUploadToJpeg } from './convert-heic-upload';
import {
  isHeicExtension,
  isUploadExtension,
  maxUploadBytes,
  parseExtension,
  resolveUploadMimeType,
  uploadFormatLabel,
} from './image-format';

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

    if (!isUploadExtension(parseExtension(fileName))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `納品書画像は ${uploadFormatLabel} のみ対応しています。`,
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

    if (data.file.size > maxUploadBytes) {
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
  mimeType: string;
}> {
  const parsed = deliveryNoteUploadSchema.safeParse({
    file: formData.get('file'),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? '納品書画像を取得できませんでした。');
  }

  const fileEntry = parsed.data.file;
  const rawName = fileEntry.name.trim();
  const extension = parseExtension(rawName);
  const fileName = rawName.slice(0, rawName.length - extension.length).trim();
  const imageBuffer = Buffer.from(await fileEntry.arrayBuffer());

  if (isHeicExtension(extension)) {
    const converted = await convertHeicUploadToJpeg({
      fileName: rawName,
      imageBuffer,
    });
    return {
      ...converted,
      fileName,
    };
  }

  return {
    fileName,
    imageBuffer,
    mimeType: resolveUploadMimeType(extension),
  };
}
