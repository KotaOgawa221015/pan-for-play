type PositionedLine = {
  y: number;
  text: string;
};

type RecognizedTextBlock = {
  paragraphs: Array<{
    lines: Array<{
      bbox: {
        y0: number;
      };
      text: string;
    }>;
  }>;
};

function collectLines(blocks: RecognizedTextBlock[] | null): string[] {
  if (!blocks) {
    return [];
  }

  return blocks
    .flatMap((block) =>
      block.paragraphs.flatMap((paragraph) =>
        paragraph.lines.map(
          (line): PositionedLine => ({
            y: line.bbox.y0,
            text: line.text,
          }),
        ),
      ),
    )
    .sort((left, right) => left.y - right.y)
    .map((line) => line.text.trim())
    .filter((line) => line.length > 0);
}

export function extractRecognizedLines(blocks: RecognizedTextBlock[] | null) {
  return collectLines(blocks)
    .map((line) => line.replace(/\s+/gu, ' ').trim())
    .filter((line) => line.length > 0);
}

export function extractRecognizedCounts(blocks: RecognizedTextBlock[] | null) {
  return collectLines(blocks).map((line) => {
    const digitsOnly = line.replace(/[^\d]/gu, '');

    if (!/^\d+$/u.test(digitsOnly)) {
      throw new Error(`数量行を整数として認識できませんでした: ${line}`);
    }

    return Number.parseInt(digitsOnly, 10);
  });
}
