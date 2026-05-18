export class UnreadableDeliveryNoteImageError extends Error {
  readonly userMessage =
    '納品書を読み取れませんでした。見本のように納品書全体が写るよう撮影し直して、もう一度アップロードしてください。';

  constructor(message: string) {
    super(message);
    this.name = 'UnreadableDeliveryNoteImageError';
  }
}
