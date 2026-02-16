'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CreatePostRequest } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAdminPost } from '@/features/posts/hooks';
import { createPostAction } from '@/lib/actions/posts';
import { EditorLoadingState, EditorErrorState } from '@/components/admin/EditorPageState';

const TiptapEditor = dynamic(() => import('@/components/admin/TiptapEditor'), {
  ssr: false,
  loading: () => <EditorLoadingState message="에디터 로딩 중..." />,
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
    return <EditorErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  if (cloneId && cloneLoading) {
    return <EditorLoadingState message="복제할 게시글 로딩 중..." />;
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
    <TiptapEditor
      initialValues={initialValues}
      isSubmitting={isLoading}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
