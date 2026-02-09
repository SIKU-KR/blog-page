import React, { memo } from 'react';
import { PostSummary } from '../../types';
import { PostList } from '@/features/posts/components';
import ErrorMessage from '../ui/feedback/ErrorMessage';

interface BlogSectionTranslations {
  noPosts: string;
  loadError: string;
}

interface BlogSectionProps {
  posts?: PostSummary[];
  className?: string;
  onPageChange?: (page: number) => void;
  translations?: BlogSectionTranslations;

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
  className = '',
  onPageChange,
  translations,
  pagination,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: BlogSectionProps) {
  if (!posts) {
    return (
      <section className={`py-2 ${className}`}>
        <ErrorMessage message={translations?.loadError || 'Failed to load blog posts.'} />
      </section>
    );
  }

  return (
    <section className={`py-2 ${className}`}>
      <PostList
        posts={posts}
        currentPage={pagination?.currentPage}
        totalPages={pagination?.totalPages}
        onPageChange={onPageChange}
        noPostsText={translations?.noPosts}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
    </section>
  );
});

export default BlogSection;
