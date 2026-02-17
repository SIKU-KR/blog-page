import { generateUUID } from './uuid';
import { logger } from './logger';

/**
 * Image compression configuration
 */
export interface CompressionOptions {
  /** Quality (0-1), default 0.85 for lossy compression */
  quality?: number;
  /** Max width in pixels, default 2048 */
  maxWidth?: number;
  /** Max height in pixels, default 2048 */
  maxHeight?: number;
  /** Preferred format: 'webp' or 'jpeg', default 'webp' */
  preferredFormat?: 'webp' | 'jpeg';
}

/**
 * Check if browser supports WebP format
 */
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    canvas.toBlob(
      blob => {
        resolve(blob !== null && blob.type === 'image/webp');
      },
      'image/webp',
      0.5
    );
  });
};

/**
 * Calculate dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

/**
 * Compress and convert image to WebP or JPEG with UUID filename
 *
 * @param file - Original image file
 * @param options - Compression options
 * @returns Promise resolving to compressed File with UUID filename
 *
 * @example
 * ```typescript
 * const compressed = await compressImage(originalFile, {
 *   quality: 0.85,
 *   maxWidth: 2048,
 *   maxHeight: 2048
 * });
 * ```
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const { quality = 0.85, maxWidth = 2048, maxHeight = 2048, preferredFormat = 'webp' } = options;

  logger.debug('이미지 압축 시작', {
    originalName: file.name,
    originalSize: file.size,
    options,
  });

  // Check WebP support
  const supportsWebP = await checkWebPSupport();
  const targetFormat = preferredFormat === 'webp' && supportsWebP ? 'webp' : 'jpeg';
  const mimeType = targetFormat === 'webp' ? 'image/webp' : 'image/jpeg';

  logger.debug('포맷 결정', { targetFormat, supportsWebP });

  // Load image
  const img = await createImageBitmap(file);
  const { width: originalWidth, height: originalHeight } = img;

  // Calculate target dimensions
  const { width: targetWidth, height: targetHeight } = calculateDimensions(
    originalWidth,
    originalHeight,
    maxWidth,
    maxHeight
  );

  logger.debug('이미지 크기 조정', {
    original: { width: originalWidth, height: originalHeight },
    target: { width: targetWidth, height: targetHeight },
  });

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 가져올 수 없습니다');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      result => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('이미지를 Blob으로 변환할 수 없습니다'));
        }
      },
      mimeType,
      quality
    );
  });

  // Generate UUID filename
  const uuid = generateUUID();
  const extension = targetFormat === 'webp' ? '.webp' : '.jpg';
  const filename = `${uuid}${extension}`;

  // Create new File object
  const compressedFile = new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });

  logger.debug('이미지 압축 완료', {
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(2) + '%',
    filename,
    format: targetFormat,
  });

  return compressedFile;
};
