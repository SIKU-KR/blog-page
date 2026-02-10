/**
 * Image Service
 * Image upload and management using Supabase Storage
 */
import { storageService, type UploadResult, type StorageImage } from '@/lib/supabase/storage';

export class ImageService {
  /**
   * Upload an image
   */
  async uploadImage(file: File, filename?: string): Promise<UploadResult> {
    return storageService.uploadImage(file, filename);
  }

  /**
   * List all images
   */
  async listImages(): Promise<StorageImage[]> {
    return storageService.listImages();
  }

  /**
   * Delete an image
   */
  async deleteImage(path: string): Promise<void> {
    return storageService.deleteImage(path);
  }
}

export const imageService = new ImageService();
