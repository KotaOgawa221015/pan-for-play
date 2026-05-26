import os from 'node:os';
import path from 'node:path';

export function getWritableRuntimeDirectory() {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'pan-for-play');
  }

  return path.join(process.cwd(), '.tmp');
}
