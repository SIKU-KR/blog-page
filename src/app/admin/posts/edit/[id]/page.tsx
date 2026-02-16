'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { UpdatePostRequest } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAdminPost } from '@/features/posts/hooks';
import { updatePostAction } from '@/lib/actions/posts';
import { EditorLoadingState, EditorErrorState } from '@/components/admin/EditorPageState';

const TiptapEditor = dynamic(() => import('@/components/admin/TiptapEditor'), {
  ssr: false,
  loading: () => <EditorLoadingState message="에디터 로딩 중..." />,
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
      <EditorErrorState
        message={saveError || '게시글 정보를 불러오는 중 오류가 발생했습니다.'}
        onRetry={() => window.location.reload()}
      />
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
    <TiptapEditor
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
