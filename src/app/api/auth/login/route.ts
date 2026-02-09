/**
 * POST /api/auth/login
 * Admin login endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, UnauthorizedError, validateLoginData } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const errors = validateLoginData(body);
    if (errors.length > 0) {
      return errorResponse(errors.join(', '), 400);
    }

    const result = await authService.login(body.username, body.password);

    // Create response with auth cookie
    const response = successResponse(result);

    // Set HTTP-only cookie for admin page access
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('POST /api/auth/login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
