/**
 * GET /api/health
 * Health check endpoint
 */
import { successResponse } from '@/lib/utils/response';

export async function GET() {
  return successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
