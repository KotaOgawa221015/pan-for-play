import { rm } from 'node:fs/promises';

export async function deleteStoredDeliveryNoteImage(storagePath: string) {
  await rm(storagePath, { force: true });
}
