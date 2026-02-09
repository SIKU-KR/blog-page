/**
 * GET /api/auth/session
 * Verify current session
 */
import { NextRequest } from 'next/server';
import { authService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { extractToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader) || request.cookies.get('auth-token')?.value;

    if (!token) {
      return successResponse({ valid: false });
    }

    const session = await authService.verifySession(token);

    return successResponse(session);
  } catch (error) {
    console.error('GET /api/auth/session error:', error);
    return errorResponse('Internal server error', 500);
  }
}
