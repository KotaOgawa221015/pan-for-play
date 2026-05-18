import path from 'node:path';

export async function readDeliveryNoteUpload(formData: FormData): Promise<{
  fileName: string;
  imageBuffer: Buffer;
}> {
  const fileEntry = formData.get('file');

  if (!(fileEntry instanceof File)) {
    throw new Error('納品書画像を取得できませんでした。');
  }

  const fileName = fileEntry.name.trim();

  if (!fileName) {
    throw new Error('納品書画像のファイル名を取得できませんでした。');
  }

  if (path.extname(fileName).toLowerCase() !== '.png') {
    throw new Error('納品書画像は PNG のみ対応しています。');
  }

  if (fileEntry.size === 0) {
    throw new Error('空の画像ファイルは読み取れません。');
  }

  return {
    fileName,
    imageBuffer: Buffer.from(await fileEntry.arrayBuffer()),
  };
}
