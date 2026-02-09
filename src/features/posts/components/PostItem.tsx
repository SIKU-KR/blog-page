'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { PostSummary } from '@/types';
import Card from '@/components/ui/Card';
import { dateUtils, DateLocale } from '@/lib/utils/date';
import { usePrefetchPost } from '@/features/posts/hooks';

interface PostItemProps {
  post: PostSummary;
}

export default function PostItem({ post }: PostItemProps) {
  const t = useTranslations('post');
  const locale = useLocale() as DateLocale;
  const prefetch = usePrefetchPost();

  const handleMouseEnter = () => {
    prefetch(post.slug);
  };

  return (
    <Card className="last:mb-0" hasShadow={false} hasBorder={false} isPadded={false} style={{ marginBottom: '64px' }}>
      <article className="pb-4">
        <div className="mb-2">
          <p className="text-sm text-gray-500">{dateUtils.formatByLocale(post.createdAt, locale)}</p>
        </div>

        <Link href={`/${post.slug}`} onMouseEnter={handleMouseEnter}>
          <h2 className="text-2xl font-bold mb-3 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-600 mb-4">{post.summary}</p>

        <div className="flex justify-between items-center">
          <Link
            href={`/${post.slug}`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            onMouseEnter={handleMouseEnter}
          >
            {t('readMore')}
          </Link>
        </div>
      </article>
    </Card>
  );
}
