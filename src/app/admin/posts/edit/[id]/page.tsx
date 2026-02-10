'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { UpdatePostRequest } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAdminPost } from '@/features/posts/hooks';
import { updatePostAction } from '@/lib/actions/posts';

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

export default function EditPostPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { post, isLoading, error } = useAdminPost(postId ? parseInt(postId, 10) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (formData: {
    title: string;
    content: string;
    summary: string;
    slug: string;
    createdAt?: string;
  }) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const postData: UpdatePostRequest = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        summary: formData.summary,
        state: 'published',
        createdAt: formData.createdAt,
      };

      await updatePostAction(parseInt(postId, 10), postData);
      router.push('/admin/posts');
    } catch (err) {
      console.error('게시글 수정 오류:', err);
      setSaveError('게시글을 수정하는 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        게시글 정보를 불러오는 중...
      </div>
    );
  }

  if (error || saveError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{saveError || '게시글 정보를 불러오는 중 오류가 발생했습니다.'}</p>
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

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <VelogWriteEditor
      initialValues={{
        title: post.title,
        content: post.content,
        summary: post.summary,
        slug: post.slug,
        createdAt: post.createdAt,
      }}
      isSubmitting={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
