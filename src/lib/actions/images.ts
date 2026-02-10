'use server';

import { getAuthenticatedUser } from './auth';
import { imageService } from '@/lib/services';

export async function listImagesAction() {
  await getAuthenticatedUser();

  const images = await imageService.listImages();

  return { success: true, images };
}

export async function deleteImageAction(key: string) {
  await getAuthenticatedUser();

  await imageService.deleteImage(key);

  return { success: true };
}
