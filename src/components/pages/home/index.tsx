'use client';

import { usePostsWithParams } from '@/features/posts/hooks';
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

  // SWR hook handles all data fetching, caching, and URL param parsing
  const { posts, page, isLoading } = usePostsWithParams(initialPosts);

  // Simple URL param updater
  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();

    const newParams = {
      page: String(page),
      ...updates,
    };

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    router.push(`/?${params.toString()}`);
  };

  if (isLoading && !posts) {
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
          posts={posts || initialPosts}
          onPageChange={newPage => updateParams({ page: String(newPage) })}
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
