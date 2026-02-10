'use client';

import { useInfinitePosts } from '@/features/posts/hooks';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import Container from '../../ui/Container';
import HeroSection from '../../sections/HeroSection';
import BlogSection from '../../sections/BlogSection';
import Divider from '../../ui/Divider';
import type { PostListResponse } from '../../../types';
import Loading from '../../ui/feedback/Loading';

interface HomePageProps {
  initialPosts: PostListResponse;
  initialPage?: number;
}

const HomePage = ({ initialPosts }: HomePageProps) => {
  const router = useRouter();

  // SWR hook for infinite scroll
  const { posts, isLoading, size, setSize, isReachingEnd, isLoadingMore } = useInfinitePosts(initialPosts);

  const handleLoadMore = useCallback(() => {
    setSize(prev => prev + 1);
  }, [setSize]);

  if (isLoading && !posts.length) {
    return (
      <Container size="md">
        <Loading />
      </Container>
    );
  }

  return (
    <Container size="md">
      <HeroSection
        title="안녕하세요, SIKU(시쿠)입니다."
        subtitle="건국대학교 컴퓨터공학부 4학년 재학중이며,\n다양한 경험과 배움을 제것으로 만들고자 포스팅에 기록하고 있습니다."
        imageSrc="/profile.jpg"
        profileAlt="프로필 이미지"
      />

      <Divider variant="border" />

      <div className="py-2">
        <BlogSection
          posts={posts}
          onLoadMore={handleLoadMore}
          hasMore={!isReachingEnd}
          isLoadingMore={isLoadingMore}
          translations={{
            noPosts: '게시글이 없습니다.',
            loadError: '블로그 게시물을 불러오는 중 오류가 발생했습니다.',
          }}
        />
      </div>
    </Container>
  );
};

export default HomePage;
