'use client';

import React, { memo } from 'react';
import { PostSummary } from '@/types';
import PostItem from './PostItem';
import Pagination from '@/components/ui/Pagination';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import Loading from '@/components/ui/feedback/Loading';

interface PostListProps {
  posts: PostSummary[];
  currentPage?: number;
  totalPages?: number;
  baseUrl?: string;
  onPageChange?: (page: number) => void;
  footerRight?: React.ReactNode;
  noPostsText?: string;

  // Infinite scroll props
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

/**
 * Optimized PostList with React.memo
 *
 * Prevents unnecessary re-renders when parent updates
 * but props haven't changed
 */
const PostList = memo(function PostList({
  posts,
  currentPage = 1,
  totalPages = 1,
  baseUrl = '/',
  onPageChange,
  footerRight,
  noPostsText,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: PostListProps) {
  const loadMoreRef = useIntersectionObserver({
    onIntersect: onLoadMore,
    enabled: hasMore && !isLoadingMore,
    rootMargin: '200px', // Trigger 200px before end
  });

  return (
    <div className="max-w-3xl">
      {posts.length > 0 ? (
        <>
          {posts.map(post => (
            <PostItem key={post.id} post={post} />
          ))}

          {onLoadMore ? (
            /* Infinite Scroll Loading & Sentinel */
            <div className="mt-8">
              {/* Sentinel for IntersectionObserver */}
              <div ref={loadMoreRef} className="h-4 w-full" />

              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loading />
                </div>
              )}
            </div>
          ) : (
            /* Pagination Fallback */
            footerRight ? (
              <div className="mt-6 grid grid-cols-3 items-center">
                <div />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={baseUrl}
                  onPageChange={onPageChange}
                  className="mt-0 justify-self-center"
                />
                <div className="justify-self-end flex items-center gap-3">{footerRight}</div>
              </div>
            ) : (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={baseUrl}
                  onPageChange={onPageChange}
                />
              </div>
            )
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">{noPostsText || 'No posts found.'}</p>
        </div>
      )}
    </div>
  );
});

export default PostList;
