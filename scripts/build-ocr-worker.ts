import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const tesseractGetCorePath = require.resolve(
  'tesseract.js/src/worker-script/node/getCore.js',
);
const tesseractRequire = createRequire(tesseractGetCorePath);
const outputDirectory = path.join(process.cwd(), 'dist');
const tesseractCoreDirectory = path.dirname(
  tesseractRequire.resolve('tesseract.js-core/package.json'),
);

await mkdir(outputDirectory, { recursive: true });

await build({
  entryPoints: ['src/features/receiving/delivery-note/ocr-worker.cjs'],
  outfile: 'dist/ocr-worker.cjs',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  sourcemap: false,
  logLevel: 'info',
  external: ['node:worker_threads', 'node:fs', 'node:path', 'node:zlib'],
});

const tesseractCoreFiles = await readdir(tesseractCoreDirectory);
const wasmFileNames = tesseractCoreFiles.filter((fileName) =>
  /^tesseract-core.*\.wasm$/.test(fileName),
);

await Promise.all(
  wasmFileNames.map((fileName) =>
    copyFile(
      path.join(tesseractCoreDirectory, fileName),
      path.join(outputDirectory, fileName),
    ),
  ),
);
