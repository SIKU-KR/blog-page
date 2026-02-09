'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/index';
import { UpdatePostRequest, Post } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';

// Dynamic import for heavy markdown editor component
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
  useAuthGuard(); // Protect this admin route
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 게시글 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const postData = await api.posts.getAdminOne(parseInt(postId, 10));
        setPost(postData);
        setError(null);
      } catch (err) {
        console.error('데이터 로딩 오류:', err);
        setError('게시글 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  // 게시글 수정
  const handleSave = async (formData: {
    title: string;
    content: string;
    summary: string;
    slug: string;
    createdAt?: string;
  }) => {
    setIsSaving(true);
    setError(null);

    try {
      const postData: UpdatePostRequest = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        summary: formData.summary,
        state: 'published',
        createdAt: formData.createdAt,
      };

      await api.posts.update(parseInt(postId, 10), postData);
      router.push('/admin/posts');
    } catch (err) {
      console.error('게시글 수정 오류:', err);
      setError('게시글을 수정하는 중 오류가 발생했습니다.');
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
