'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CreatePostRequest } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAdminPost } from '@/features/posts/hooks';
import { createPostAction } from '@/lib/actions/posts';

const VelogWriteEditor = dynamic(() => import('@/components/admin/VelogWriteEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">에디터 로딩 중...</p>
      </div>
    </div>
  ),
});

export default function WritePostPage() {
  useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get('clone');

  const { post: clonePost, isLoading: cloneLoading } = useAdminPost(
    cloneId ? parseInt(cloneId, 10) : null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (formData: {
    title: string;
    content: string;
    summary: string;
    slug: string;
    createdAt?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const postData: CreatePostRequest = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        summary: formData.summary,
        state: 'published',
        createdAt: formData.createdAt,
      };

      await createPostAction(postData);
      router.push('/admin/posts');
    } catch (err) {
      console.error('게시글 저장 오류:', err);
      setError('게시글을 저장하는 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (cloneId && cloneLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">복제할 게시글 로딩 중...</p>
        </div>
      </div>
    );
  }

  const initialValues = clonePost
    ? {
        title: `${clonePost.title} (복사본)`,
        content: clonePost.content,
        summary: clonePost.summary,
        slug: '',
      }
    : {
        title: '',
        content: '',
      };

  return (
    <VelogWriteEditor
      initialValues={initialValues}
      isSubmitting={isLoading}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
