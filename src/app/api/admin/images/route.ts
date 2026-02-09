/**
 * POST /api/admin/images
 * Admin: Upload an image
 */
import { NextRequest } from 'next/server';
import { imageService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const result = await imageService.uploadImage(file);

    return successResponse(result, 201);
  } catch (error) {
    console.error('POST /api/admin/images error:', error);

    if (error instanceof Error) {
      // Pass through validation errors from the service
      if (error.message.includes('Invalid file type') || error.message.includes('File too large')) {
        return errorResponse(error.message, 400);
      }
    }

    return errorResponse('Internal server error', 500);
  }
}
