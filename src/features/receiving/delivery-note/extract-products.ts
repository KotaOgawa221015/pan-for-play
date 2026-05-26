import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { getWritableRuntimeDirectory } from '@/lib/runtime-directory';
import { buildColumnRectangles } from './build-column-rectangles';
import { createProcessedCountImageBuffer } from './create-processed-count-image-buffer';
import {
  extractRecognizedCounts,
  extractRecognizedLines,
} from './extract-recognized-lines';
import { UnreadableDeliveryNoteImageError } from './unreadable-image-error';

type ExtractedDeliveryNoteProduct = {
  name: string;
  count: number;
};

export type ExtractDeliveryNoteProducts = (input: {
  fileName: string;
  imageBuffer: Buffer;
}) => Promise<ExtractedDeliveryNoteProduct[]>;

const tesseractCachePath = path.join(
  getWritableRuntimeDirectory(),
  'tesseract-cache',
);

export const extractProductsFromDeliveryNote: ExtractDeliveryNoteProducts =
  async ({ fileName, imageBuffer }) => {
    const [{ Jimp }, { default: Tesseract }] = await Promise.all([
      import('jimp'),
      import('tesseract.js'),
    ]);
    const { createWorker, PSM } = Tesseract;

    await mkdir(tesseractCachePath, { recursive: true });

    const [namesWorker, countsWorker] = await Promise.all([
      createWorker('jpn', undefined, { cachePath: tesseractCachePath }),
      createWorker('eng', undefined, { cachePath: tesseractCachePath }),
    ]);

    try {
      await namesWorker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1',
      });
      await countsWorker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: '0123456789',
      });

      const image = await Jimp.read(imageBuffer);
      const rectangles = buildColumnRectangles({
        width: image.bitmap.width,
        height: image.bitmap.height,
      });
      const processedCountImage = await createProcessedCountImageBuffer(
        image,
        rectangles.countDigitsCrop,
      );

      const [namesResult, countsResult] = await Promise.all([
        namesWorker.recognize(
          imageBuffer,
          { rectangle: rectangles.nameColumn },
          { text: true, blocks: true, tsv: true },
        ),
        countsWorker.recognize(
          processedCountImage,
          {},
          { text: true, blocks: true, tsv: true },
        ),
      ]);

      const products = extractRecognizedLines(namesResult.data.blocks);
      const counts = extractRecognizedCounts(countsResult.data.blocks);

      if (products.length === 0) {
        throw new UnreadableDeliveryNoteImageError(
          `商品名を認識できませんでした: ${fileName}`,
        );
      }

      if (counts.length === 0) {
        throw new UnreadableDeliveryNoteImageError(
          `数量を認識できませんでした: ${fileName}`,
        );
      }

      if (products.length !== counts.length) {
        throw new UnreadableDeliveryNoteImageError(
          `商品名行数と数量行数が一致しません: ${fileName} (${products.length}件 / ${counts.length}件)`,
        );
      }

      return products.map((name, index) => {
        const count = counts[index];

        if (count === undefined) {
          throw new Error(`数量行を取得できませんでした: ${fileName}`);
        }

        return {
          name,
          count,
        };
      });
    } finally {
      await namesWorker.terminate();
      await countsWorker.terminate();
    }
  };
