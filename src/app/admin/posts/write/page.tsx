'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/index';
import { CreatePostRequest } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';

// Dynamic import for heavy markdown editor component
// Reduces initial bundle size by ~100KB
const VelogWriteEditor = dynamic(() => import('@/components/admin/VelogWriteEditor'), {
  ssr: false, // Editor requires browser APIs
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
  useAuthGuard(); // Protect this admin route
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 게시글 저장
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

      await api.posts.create(postData);
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

  return (
    <VelogWriteEditor
      initialValues={{
        title: '',
        content: '',
      }}
      isSubmitting={isLoading}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
