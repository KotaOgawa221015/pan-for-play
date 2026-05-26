import { describe, expect, it } from 'vitest';
import { convertHeicUploadToJpeg } from './convert-heic-upload';

describe('convertHeicUploadToJpeg', () => {
  it('converts a HEIC upload into a JPEG buffer', async () => {
    const converted = await convertHeicUploadToJpeg({
      fileName: 'test.heic',
      imageBuffer: Buffer.from('heic'),
      convert: async ({ buffer, format, quality }) => {
        expect(buffer).toEqual(Buffer.from('heic'));
        expect(format).toBe('JPEG');
        expect(quality).toBe(0.9);
        return Buffer.from([0xff, 0xd8, 0xff, 0x00]);
      },
    });

    expect(converted.fileName).toBe('test.jpg');
    expect(converted.mimeType).toBe('image/jpeg');
    expect(converted.imageBuffer.subarray(0, 3)).toEqual(
      Buffer.from([0xff, 0xd8, 0xff]),
    );
  });
});
