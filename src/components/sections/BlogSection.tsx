import React, { memo } from 'react';
import { PostSummary } from '../../types';
import { PostList } from '@/features/posts/components';
import ErrorMessage from '../ui/feedback/ErrorMessage';

interface BlogSectionProps {
  posts?: PostSummary[];
  totalPosts?: number;
  className?: string;
  onPageChange?: (page: number) => void;

  // Pagination props (legacy)
  pagination?: {
    currentPage: number;
    totalPages: number;
  };

  // Infinite scroll props
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const BlogSection = memo(function BlogSection({
  posts,
  totalPosts,
  className = '',
  onPageChange,
  pagination,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: BlogSectionProps) {
  if (!posts) {
    return (
      <section className={`py-2 ${className}`}>
        <ErrorMessage message="블로그 게시물을 불러오는 중 오류가 발생했습니다." />
      </section>
    );
  }

  return (
    <section className={`py-2 ${className}`}>
      <PostList
        posts={posts}
        totalPosts={totalPosts}
        currentPage={pagination?.currentPage}
        totalPages={pagination?.totalPages}
        onPageChange={onPageChange}
        noPostsText="게시글이 없습니다."
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
    </section>
  );
});

export default BlogSection;
