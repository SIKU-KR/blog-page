import React from 'react';
import Link from 'next/link';
import { PostSummary } from '@/types';
import Card from '@/components/ui/Card';
import { dateUtils } from '@/lib/utils/date';

interface PostItemProps {
  post: PostSummary;
}

export default function PostItem({ post }: PostItemProps) {
  return (
    <Card
      className="last:mb-0"
      hasShadow={false}
      hasBorder={false}
      isPadded={false}
      style={{ marginBottom: '64px' }}
    >
      <article className="pb-4">
        <div className="mb-2">
          <p className="text-sm text-gray-500">{dateUtils.format(post.createdAt)}</p>
        </div>

        <Link href={`/${post.slug}`}>
          <h2 className="text-2xl font-bold mb-3 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-600 mb-4">{post.summary}</p>

        <div className="flex justify-between items-center">
          <Link
            href={`/${post.slug}`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            더 읽기
          </Link>
        </div>
      </article>
    </Card>
  );
}
