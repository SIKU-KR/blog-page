import Link from 'next/link';
import { RelatedPost } from '@/types';

interface RelatedPostsProps {
  posts: RelatedPost[];
  maxPosts?: number;
  title?: string;
}

export default function RelatedPosts({ posts, maxPosts = 2, title }: RelatedPostsProps) {
  const displayPosts = posts.slice(0, maxPosts);

  if (displayPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 mb-8">
      <h2 className="text-xl font-bold mb-6 mx-2">{title || '추천 게시물'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPosts.map(post => (
          <Link
            key={post.id}
            href={`/${post.slug}`}
            className="group block p-5 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-gray-100 hover:border-gray-200 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-medium text-gray-800 group-hover:text-gray-900 line-clamp-2 flex-1">
                {post.title}
              </h3>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
