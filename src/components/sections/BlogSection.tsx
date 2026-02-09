'use client';

import React, { memo, useMemo } from 'react';
import { PostSummary } from '../../types';
import { PostList } from '@/features/posts/components';
import ErrorMessage from '../ui/feedback/ErrorMessage';

interface BlogSectionTranslations {
  noPosts: string;
  loadError: string;
}

interface BlogSectionProps {
  posts?: {
    content: PostSummary[];
    totalElements: number;
    pageNumber: number;
    pageSize: number;
  };
  className?: string;
  onPageChange?: (page: number) => void;
  translations?: BlogSectionTranslations;
}

const BlogSection = memo(function BlogSection({
  posts,
  className = '',
  onPageChange,
  translations,
}: BlogSectionProps) {
  // Memoize pagination calculations (must be called before any early returns)
  const { totalPages, currentPage } = useMemo(() => {
    if (!posts) return { totalPages: 0, currentPage: 0 };
    return {
      totalPages: Math.ceil(posts.totalElements / posts.pageSize),
      currentPage: posts.pageNumber + 1,
    };
  }, [posts]);

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
        posts={posts.content}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        noPostsText={translations?.noPosts}
      />
    </section>
  );
});

export default BlogSection;
