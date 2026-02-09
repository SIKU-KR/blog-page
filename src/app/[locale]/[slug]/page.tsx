import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api/index';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/feedback/Loading';
import ErrorMessage from '@/components/ui/feedback/ErrorMessage';
import { Comments } from '@/features/comments/components';
import Divider from '@/components/ui/Divider';
import MarkdownRenderer from '@/components/ui/data-display/MarkdownRenderer';
import { Metadata } from 'next';
import Link from 'next/link';
import { RelatedPosts, ShareButton, ViewCounter } from '@/features/posts/components';
import { getPostMetadata, getPostMetadataById } from '@/lib/metadata';
import RedirectHandler from '@/components/RedirectHandler';
import { isClientError, getErrorMessage } from '@/lib/utils/errors';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

interface PostDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    const post = /^\d+$/.test(slug)
      ? await api.posts.getOne(parseInt(slug, 10), locale)
      : await api.posts.getBySlug(slug, locale);

    if (!post) {
      return {
        title: locale === 'en' ? 'Post not found' : '게시물을 찾을 수 없음',
        description: locale === 'en' ? 'The requested post could not be found.' : '요청하신 게시물을 찾을 수 없습니다.',
      };
    }

    const description = post.summary || post.content.slice(0, 150).replace(/[#*`]/g, '');

    if (post.canonicalPath) {
      return getPostMetadata(
        post.title,
        description,
        post.slug,
        post.canonicalPath,
        post.createdAt,
        post.updatedAt
      );
    }

    return getPostMetadataById(post.title, description, post.id, post.createdAt, post.updatedAt);
  } catch (error) {
    console.error('Metadata generation error:', error);
    return {
      title: locale === 'en' ? 'Post not found' : '게시물을 찾을 수 없음',
      description: locale === 'en' ? 'The requested post could not be found.' : '요청하신 게시물을 찾을 수 없습니다.',
    };
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug, locale } = await params;

  setRequestLocale(locale);
  const t = await getTranslations('post');

  try {
    let post;

    if (/^\d+$/.test(slug)) {
      post = await api.posts.getOne(parseInt(slug, 10), locale);

      const redirectPath = post.canonicalPath || `/${post.slug}`;
      const currentPath = `/${slug}`;

      if (currentPath !== redirectPath) {
        const localePath = locale === 'ko' ? redirectPath : `/${locale}${redirectPath}`;
        return <RedirectHandler redirectPath={localePath} />;
      }
    } else {
      post = await api.posts.getBySlug(slug, locale);
    }

    if (!post || !post.id) {
      notFound();
    }

    const formattedDate = new Date(post.createdAt).toLocaleDateString(
      locale === 'en' ? 'en-US' : 'ko-KR',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    return (
      <Container size="md" className="py-4">
        <ViewCounter postId={post.id.toString()} />
        <article itemScope itemType="https://schema.org/BlogPosting">
          <header className="mb-8">
            {post.tags && post.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {post.tags
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((tag) => (
                    <Link
                      key={tag}
                      href={locale === 'ko' ? `/?tag=${encodeURIComponent(tag)}` : `/${locale}?tag=${encodeURIComponent(tag)}`}
                    >
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                        #{tag}
                      </span>
                    </Link>
                  ))}
              </div>
            )}

            <h1 className="text-3xl font-bold mb-2" itemProp="headline">
              {post.title}
            </h1>
            <div className="flex items-center text-sm text-gray-500">
              <span
                className="mr-2"
                itemProp="author"
                itemScope
                itemType="https://schema.org/Person"
              >
                <span itemProp="name">Siku</span>
              </span>
              <time itemProp="datePublished" dateTime={post.createdAt}>
                {formattedDate}
              </time>
              <div className="ml-auto">
                <ShareButton className="hover:bg-gray-100" canonicalUrl={post.canonicalPath} />
              </div>
            </div>
          </header>

          <Divider variant="border" />

          <div itemProp="articleBody">
            <Suspense fallback={<Loading />}>
              <MarkdownRenderer content={post.content} />
            </Suspense>
          </div>
        </article>

        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <>
            <Divider variant="border" />
            <RelatedPosts posts={post.relatedPosts} maxPosts={2} title={t('relatedPosts')} locale={locale} />
          </>
        )}

        <Divider variant="border" />

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 mx-2">{t('comments')}</h2>
        </div>

        <section>
          <Suspense fallback={<Loading />}>
            <Comments postId={post.id.toString()} />
          </Suspense>
        </section>
      </Container>
    );
  } catch (err: unknown) {
    console.error('Error loading data:', err);

    if (isClientError(err)) {
      const errorMessage = getErrorMessage(err);
      return (
        <Container size="md" className="py-8">
          <ErrorMessage message={errorMessage || (locale === 'en' ? 'Invalid post URL.' : '잘못된 게시글 주소입니다.')} />
          <div className="mt-4 text-center">
            <Link
              href={locale === 'ko' ? '/' : `/${locale}`}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {locale === 'en' ? 'Go to Home' : '홈으로 돌아가기'}
            </Link>
          </div>
        </Container>
      );
    }

    return <ErrorMessage message={locale === 'en' ? 'An error occurred while loading data.' : '데이터를 불러오는 중 오류가 발생했습니다.'} />;
  }
}

export async function generateStaticParams() {
  try {
    const { sitemapService } = await import('@/lib/services');
    const sitemap = await sitemapService.getSitemapData();

    const params: { locale: string; slug: string }[] = [];
    for (const entry of sitemap) {
      params.push({ locale: entry.locale, slug: entry.slug });
    }

    return params;
  } catch (error) {
    console.error('Error generating static paths:', error);
    return [];
  }
}

export const revalidate = 60;
