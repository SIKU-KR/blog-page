'use client';

import { useCallback } from 'react';
import { useInfinitePosts } from '@/features/posts/hooks';
import HomePageShell from '@/components/pages/home/HomePageShell';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/feedback/Loading';
import type { PostListResponse } from '@/types';

interface HomePageProps {
  initialPosts: PostListResponse;
  initialPage?: number;
}

const HomePage = ({ initialPosts }: HomePageProps) => {
  const { posts, isLoading, size, setSize, isReachingEnd, isLoadingMore, totalElements } =
    useInfinitePosts(initialPosts);

  const handleLoadMore = useCallback(() => {
    setSize(prev => prev + 1);
  }, [setSize]);

  const hasMore = !Boolean(isReachingEnd);
  const loadingMore = Boolean(isLoadingMore);

  if (isLoading && !posts.length) {
    return (
      <Container size="md">
        <Loading />
      </Container>
    );
  }

  return (
    <HomePageShell
      posts={posts}
      totalElements={totalElements}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      isLoadingMore={loadingMore}
    />
  );
};

export default HomePage;
