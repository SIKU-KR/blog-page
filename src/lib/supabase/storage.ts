/**
 * Supabase Storage Utilities
 * Image upload and management for blog posts
 */
import { createClient } from './server';

const BUCKET_NAME = 'blog-images';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  path: string;
}

export class StorageService {
  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(file: File, filename?: string): Promise<UploadResult> {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const supabase = createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const extension = this.getFileExtension(file.type);
    const safeName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'image';
    const path = `posts/${timestamp}-${safeName}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(path: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return extensions[mimeType] || 'jpg';
  }
}

// Export singleton instance
export const storageService = new StorageService();
