import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectoryPath = path.dirname(fileURLToPath(import.meta.url));
const docsDirectoryPath = path.resolve(testDirectoryPath, '..', '..');
const repositoryRootPath = path.resolve(docsDirectoryPath, '..');

loadEnv({ path: path.join(repositoryRootPath, '.env'), quiet: true });
loadEnv({
  path: path.join(docsDirectoryPath, '.env'),
  override: true,
  quiet: true,
});
