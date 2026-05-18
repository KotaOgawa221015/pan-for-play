import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const deliveryNoteDirectoryPath = path.join(
  process.cwd(),
  '.tmp',
  'receiving-delivery-notes',
);

function sanitizeFileName(fileName: string) {
  return path
    .basename(fileName)
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
}

export async function storeDeliveryNoteImage(input: {
  batchId: string;
  fileName: string;
  imageBuffer: Buffer;
}) {
  const directoryPath = path.join(deliveryNoteDirectoryPath, input.batchId);
  const storagePath = path.join(
    directoryPath,
    sanitizeFileName(input.fileName),
  );

  await mkdir(directoryPath, { recursive: true });
  await writeFile(storagePath, input.imageBuffer);

  return storagePath;
}
