/**
 * API Response Utilities
 * Standardized response format for Next.js API routes
 */
import { NextResponse } from 'next/server';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ErrorResponseBody {
  success: false;
  data: null;
  error: {
    code: number;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Create a successful API response
 * Uses JSON serialization to convert Date objects to ISO strings
 */
export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    JSON.parse(JSON.stringify({
      success: true,
      data,
      error: null,
    })),
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status = 400
): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: status,
        message,
      },
    },
    { status }
  );
}

/**
 * Create a paginated API response
 */
export function paginatedResponse<T>(
  data: PaginatedResponse<T>
): NextResponse<SuccessResponse<PaginatedResponse<T>>> {
  return successResponse(data);
}
