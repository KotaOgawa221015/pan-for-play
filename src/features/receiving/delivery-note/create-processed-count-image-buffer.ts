import type { CountDigitsCrop } from './build-column-rectangles';

type CountImagePipeline = {
  crop(crop: CountDigitsCrop): CountImagePipeline;
  greyscale(): CountImagePipeline;
  contrast(value: number): CountImagePipeline;
  threshold(options: { max: number }): CountImagePipeline;
  resize(options: { w: number; h: number }): CountImagePipeline;
  getBuffer(mime: 'image/png'): Promise<Buffer>;
};

type LoadedImage = {
  clone(): CountImagePipeline;
};

export async function createProcessedCountImageBuffer(
  image: LoadedImage,
  countDigitsCrop: CountDigitsCrop,
) {
  return image
    .clone()
    .crop(countDigitsCrop)
    .greyscale()
    .contrast(1)
    .threshold({ max: 210 })
    .resize({
      w: countDigitsCrop.w * 4,
      h: countDigitsCrop.h * 4,
    })
    .getBuffer('image/png');
}
