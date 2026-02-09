'use client';

import { useInfinitePosts } from '@/features/posts/hooks';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('hero');
  const tPost = useTranslations('post');

  // SWR hook for infinite scroll
  const { posts, isLoading, size, setSize, isReachingEnd, isLoadingMore } = useInfinitePosts(initialPosts);

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
        title={t('title')}
        subtitle={t('subtitle')}
        imageSrc="/profile.jpg"
        profileAlt={t('profileAlt')}
      />

      <Divider variant="border" />

      <div className="py-2">
        <BlogSection
          posts={posts}
          onLoadMore={() => setSize(size + 1)}
          hasMore={!isReachingEnd}
          isLoadingMore={isLoadingMore}
          translations={{
            noPosts: tPost('noPosts'),
            loadError: tPost('loadError'),
          }}
        />
      </div>
    </Container>
  );
};

export default HomePage;
