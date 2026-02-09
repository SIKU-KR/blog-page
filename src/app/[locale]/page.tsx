import { PostListResponse } from '@/types';
import { Metadata } from 'next';
import { homeMetadata } from '@/lib/metadata';
import HomePage from '@/components/pages/home';
import { setRequestLocale } from 'next-intl/server';
import { postService } from '@/lib/services';

type SearchParams = {
  page?: string;
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadata;
}

export default async function Home({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page } = await searchParams;

  // Enable static rendering
  setRequestLocale(locale);

  const currentPage = typeof page === 'string' ? parseInt(page, 10) : 1;

  let postsData: PostListResponse = { content: [], totalElements: 0, pageNumber: 0, pageSize: 5 };

  try {
    const postsResult = await postService.getPosts({
      locale,
      page: currentPage - 1,
      size: 5,
      sort: 'createdAt,desc',
    });

    postsData = {
      content: postsResult.content.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary || '',
        state: p.state as 'draft' | 'published',
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
      })),
      totalElements: postsResult.totalElements,
      pageNumber: postsResult.pageNumber,
      pageSize: postsResult.pageSize,
    };
  } catch (error) {
    console.error('Error loading data:', error);
  }

  return (
    <HomePage
      initialPosts={postsData}
      initialPage={currentPage}
    />
  );
}

export const revalidate = 3600;
