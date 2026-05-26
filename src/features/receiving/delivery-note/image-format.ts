export const maxUploadBytes = 5 * 1024 * 1024;

export const processingExtensions = ['.png', '.jpg', '.jpeg'] as const;
export const uploadExtensions = [...processingExtensions, '.heic'] as const;
export const browserReadableMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/heic',
] as const;

const uploadExtensionSet = new Set<string>(uploadExtensions);

export const browserAcceptValue = [
  ...browserReadableMimeTypes,
  ...uploadExtensions,
].join(',');

export const uploadFormatLabel = uploadExtensions.map(toFormatLabel).join(', ');

function toFormatLabel(extension: string): string {
  return extension.slice(1).toUpperCase();
}

export function parseExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return '';
  }
  return fileName.slice(dotIndex).toLowerCase();
}

export function isUploadExtension(extension: string): boolean {
  return uploadExtensionSet.has(extension);
}

export function isHeicExtension(extension: string): boolean {
  return extension === '.heic';
}

export function resolveUploadMimeType(extension: string): string {
  switch (extension) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.heic':
      return 'image/heic';
    default:
      throw new Error(`Unsupported upload extension: ${extension}`);
  }
}

export function toJpegName(fileName: string): string {
  const extension = parseExtension(fileName);
  if (!extension) {
    return `${fileName}.jpg`;
  }
  return `${fileName.slice(0, -extension.length)}.jpg`;
}
