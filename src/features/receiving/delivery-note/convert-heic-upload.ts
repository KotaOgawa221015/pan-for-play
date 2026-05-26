import { toJpegName } from './image-format';

type ConvertHeic = (options: {
  buffer: Buffer;
  format: 'JPEG';
  quality: number;
}) => Promise<Buffer | Uint8Array | ArrayBuffer>;

export class HeicUploadConversionError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('HEIC画像をJPGに変換できませんでした。別の形式でお試しください。', {
      cause: options?.cause,
    });
    this.name = 'HeicUploadConversionError';
  }
}

export async function convertHeicUploadToJpeg(input: {
  fileName: string;
  imageBuffer: Buffer;
  convert?: ConvertHeic;
}): Promise<{
  fileName: string;
  imageBuffer: Buffer;
  mimeType: string;
}> {
  try {
    const convert = input.convert ?? (await loadHeicConverter());
    const converted = await convert({
      buffer: input.imageBuffer,
      format: 'JPEG',
      quality: 0.9,
    });

    return {
      fileName: toJpegName(input.fileName),
      imageBuffer:
        converted instanceof ArrayBuffer
          ? Buffer.from(converted)
          : Buffer.from(converted),
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    throw new HeicUploadConversionError({ cause: error });
  }
}

async function loadHeicConverter(): Promise<ConvertHeic> {
  const module = await import('heic-convert');
  return module.default;
}
