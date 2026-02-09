import { PostListResponse, Tag, SortOption } from '@/types';
import { Metadata } from 'next';
import { homeMetadata, getTagMetadata } from '@/lib/metadata';
import HomePage from '@/components/pages/home';
import { setRequestLocale } from 'next-intl/server';
import { postService, tagService } from '@/lib/services';

type SearchParams = {
  page?: string;
  tag?: string;
  sort?: string;
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { tag } = await searchParams;

  if (!tag) {
    return homeMetadata;
  }

  try {
    const tags = await tagService.getActiveTags(locale);
    const selectedTag = tags.find((t) => t.name === tag);

    if (selectedTag) return getTagMetadata(selectedTag.name);
  } catch (error) {
    console.error('Error loading tag data:', error);
  }

  return homeMetadata;
}

export default async function Home({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page, tag, sort } = await searchParams;

  // Enable static rendering
  setRequestLocale(locale);

  const currentPage = typeof page === 'string' ? parseInt(page, 10) : 1;
  const sortOption = (sort as SortOption) || 'views,desc';

  let postsData: PostListResponse = { content: [], totalElements: 0, pageNumber: 0, pageSize: 5 };
  let tagsData: Tag[] = [];

  try {
    // 서비스 레이어 직접 호출 (SSR에서 HTTP 자기호출 방지)
    const [postsResult, tagsResult] = await Promise.all([
      postService.getPosts({
        tag: tag || null,
        locale,
        page: currentPage - 1,
        size: 5,
        sort: sortOption,
      }),
      tagService.getActiveTags(locale),
    ]);

    postsData = {
      content: postsResult.content.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary || '',
        tags: p.tags,
        state: p.state as 'draft' | 'published',
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
      })),
      totalElements: postsResult.totalElements,
      pageNumber: postsResult.pageNumber,
      pageSize: postsResult.pageSize,
    };

    tagsData = tagsResult
      .map(t => ({
        id: t.id,
        name: t.name,
        postCount: t.postCount,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      }))
      .sort((a, b) => {
        const byCount = (b.postCount || 0) - (a.postCount || 0);
        if (byCount !== 0) return byCount;
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
  } catch (error) {
    console.error('Error loading data:', error);
  }

  return (
    <HomePage
      initialPosts={postsData}
      initialTags={tagsData}
      initialPage={currentPage}
      initialTag={tag}
    />
  );
}

export const revalidate = 3600;
