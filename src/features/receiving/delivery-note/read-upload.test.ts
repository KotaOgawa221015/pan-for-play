import { beforeEach, describe, expect, it, vi } from 'vitest';
import { maxUploadBytes } from './image-format';

const { convertHeicUploadToJpeg } = vi.hoisted(() => ({
  convertHeicUploadToJpeg: vi.fn(),
}));

vi.mock('./convert-heic-upload', () => ({
  convertHeicUploadToJpeg,
}));

import { readDeliveryNoteUpload } from './read-upload';

function buildFormData(file: File): FormData {
  const formData = new FormData();
  formData.set('file', file);
  return formData;
}

describe('readDeliveryNoteUpload', () => {
  beforeEach(() => {
    convertHeicUploadToJpeg.mockReset();
  });

  it.each([
    ['invoice.png', 'image/png'],
    ['invoice.jpg', 'image/jpeg'],
    ['invoice.JPEG', 'image/jpeg'],
  ])('accepts %s', async (fileName, mimeType) => {
    const file = new File(['hello'], fileName, { type: mimeType });

    await expect(readDeliveryNoteUpload(buildFormData(file))).resolves.toEqual({
      fileName,
      imageBuffer: Buffer.from('hello'),
    });
  });

  it('converts heic uploads before returning them', async () => {
    const file = new File(['hello'], 'invoice.heic', { type: 'image/heic' });
    convertHeicUploadToJpeg.mockResolvedValue({
      fileName: 'invoice.jpg',
      imageBuffer: Buffer.from('jpeg'),
    });

    await expect(readDeliveryNoteUpload(buildFormData(file))).resolves.toEqual({
      fileName: 'invoice.jpg',
      imageBuffer: Buffer.from('jpeg'),
    });
    expect(convertHeicUploadToJpeg).toHaveBeenCalledWith({
      fileName: 'invoice.heic',
      imageBuffer: Buffer.from('hello'),
    });
  });

  it('rejects unsupported uploads', async () => {
    const file = new File(['hello'], 'invoice.gif', { type: 'image/gif' });

    await expect(readDeliveryNoteUpload(buildFormData(file))).rejects.toThrow(
      '納品書画像は PNG, JPG, JPEG, HEIC のみ対応しています。',
    );
  });

  it('rejects uploads larger than 5MB', async () => {
    const payload = new Uint8Array(maxUploadBytes + 1);
    const file = new File([payload], 'invoice.png', { type: 'image/png' });

    await expect(readDeliveryNoteUpload(buildFormData(file))).rejects.toThrow(
      '納品書画像は 5MB 以下でアップロードしてください。',
    );
  });
});
