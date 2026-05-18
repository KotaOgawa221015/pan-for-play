export type CountDigitsCrop = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type NameColumnRectangle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function buildColumnRectangles(imageSize: {
  width: number;
  height: number;
}): {
  nameColumn: NameColumnRectangle;
  countDigitsCrop: CountDigitsCrop;
} {
  const splitX = Math.round(imageSize.width * 0.84);
  const separatorPadding = Math.max(4, Math.round(imageSize.width * 0.008));
  const nameWidth = splitX - separatorPadding;
  const countDigitsLeft = Math.round(imageSize.width * 0.873);
  const countDigitsWidth = Math.max(
    1,
    Math.min(
      imageSize.width - countDigitsLeft,
      Math.round(imageSize.width * 0.104),
    ),
  );

  if (nameWidth <= 0 || countDigitsWidth <= 0) {
    throw new Error(
      `OCR対象範囲を計算できませんでした: ${imageSize.width}x${imageSize.height}`,
    );
  }

  return {
    nameColumn: {
      left: 0,
      top: 0,
      width: nameWidth,
      height: imageSize.height,
    },
    countDigitsCrop: {
      x: countDigitsLeft,
      y: 0,
      w: countDigitsWidth,
      h: imageSize.height,
    },
  };
}
