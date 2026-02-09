/**
 * GET /api/sitemap
 * Get sitemap data for SEO
 */
import { sitemapService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const entries = await sitemapService.getSitemapData();

    return successResponse(entries);
  } catch (error) {
    console.error('GET /api/sitemap error:', error);
    return errorResponse('Internal server error', 500);
  }
}
