import useSWRInfinite from 'swr/infinite';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { PostListResponse } from '@/types';
import { api } from '@/lib/api';

export function useInfinitePosts(initialData?: PostListResponse) {
    const locale = useLocale();
    const searchParams = useSearchParams();

    // Keep sort param if it exists, default to createdAt,desc
    const sort = searchParams.get('sort') || 'createdAt,desc';
    const pageSize = 5;

    const getKey = (pageIndex: number, previousPageData: PostListResponse | null) => {
        // If we have previous data and it's empty or less than page size, we've reached the end
        if (previousPageData && !previousPageData.content.length) return null;

        return [pageIndex, pageSize, sort, locale];
    };

    const fetcher = ([page, size, sort, locale]: [number, number, string, string]) =>
        api.posts.getList(page, size, sort, locale);

    const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<PostListResponse>(
        getKey,
        fetcher,
        {
            fallbackData: initialData ? [initialData] : undefined,
            revalidateFirstPage: false,
            persistSize: true,
        }
    );

    const posts = useMemo(() => {
        return data ? data.flatMap((page: PostListResponse) => page.content) : [];
    }, [data]);

    const isEmpty = data?.[0]?.content?.length === 0;
    const isReachingEnd =
        isEmpty || (data && data[data.length - 1]?.content.length < pageSize);

    const isLoadingMore =
        isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

    return {
        posts,
        isLoading,
        isLoadingMore,
        isReachingEnd,
        size,
        setSize,
        mutate,
        totalElements: data?.[0]?.totalElements || 0,
    };
}
