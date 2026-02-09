import { NextRequest } from 'next/server';
import { postService } from '@/lib/services';
import { successResponse, withErrorHandling } from '@/lib/utils/response';
import { parseRequestParams } from '@/lib/utils/request';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = parseRequestParams(request);
  const result = await postService.getPosts(params);
  return successResponse(result);
});
