import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { usePostsQuery } from './usePostsQuery';
import type { PostListResponse } from '@/types';

/**
 * Hook that integrates URL search params with SWR posts query
 * Replaces manual state management with declarative SWR approach
 *
 * @param initialData - SSR data for hydration (optional)
 */
export function usePostsWithParams(initialData?: PostListResponse) {
  const searchParams = useSearchParams();
  const locale = useLocale();

  // Parse URL params with type safety
  const params = useMemo(() => {
    const pageParam = searchParams.get('page');

    return {
      page: pageParam ? parseInt(pageParam, 10) : 1,
      sort: 'createdAt,desc' as const,
    };
  }, [searchParams]);

  const swrResult = usePostsQuery(params.page - 1, 5, params.sort, locale);

  return {
    // Use SWR data, fallback to SSR initial data
    posts: swrResult.data ?? initialData,
    isLoading: swrResult.isLoading,
    error: swrResult.error,
    mutate: swrResult.mutate,

    // Expose parsed params for components
    page: params.page,
    sort: params.sort,
  };
}
