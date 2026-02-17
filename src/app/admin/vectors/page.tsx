'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AdminErrorState from '@/components/admin/common/AdminErrorState';
import AdminInfoCard from '@/components/admin/common/AdminInfoCard';
import AdminLoadingState from '@/components/admin/common/AdminLoadingState';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AdminPagination from '@/components/admin/common/AdminPagination';
import BulkEmbeddingResultPanel from '@/components/admin/vectors/BulkEmbeddingResultPanel';
import VectorsPostsTable from '@/components/admin/vectors/VectorsPostsTable';
import { api } from '@/lib/api/index';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { BulkEmbeddingResult } from '@/lib/api/embedding';

export default function VectorsManagementPage() {
  useAuthGuard();
  const { addToast } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // 임베딩 작업 상태
  const [embeddingInProgress, setEmbeddingInProgress] = useState<number | null>(null);
  const [bulkEmbeddingInProgress, setBulkEmbeddingInProgress] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkEmbeddingResult | null>(null);

  const { data, error, isLoading, isValidating } = useSWR(
    ['posts', page, pageSize],
    () => api.posts.getList(page, pageSize),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const posts = data?.content ?? [];
  const totalPosts = data?.totalElements ?? 0;
  const errorMessage = error ? '게시글 정보를 불러오는 중 오류가 발생했습니다.' : null;
  const showLoading = isLoading || isValidating;

  const handleEmbedPost = async (postId: number) => {
    setEmbeddingInProgress(postId);
    try {
      const result = await api.embedding.embedPost(postId);
      if (result.success) {
        addToast(`포스트 #${postId} 임베딩 생성 완료`, 'success');
      } else {
        addToast(`임베딩 생성 실패: ${result.error ?? 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Embedding error:', err);
      addToast('임베딩 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setEmbeddingInProgress(null);
    }
  };

  const handleBulkEmbed = async () => {
    const confirmed = await confirm({
      title: '전체 임베딩 생성',
      message:
        '모든 포스트의 임베딩을 생성합니다. 이 작업은 시간이 걸릴 수 있습니다. 계속하시겠습니까?',
      confirmText: '생성',
      cancelText: '취소',
    });

    if (!confirmed) return;

    setBulkEmbeddingInProgress(true);
    setBulkResult(null);
    try {
      const result = await api.embedding.embedAllPosts();
      setBulkResult(result);
      addToast(
        `총 ${result.total}개 중 ${result.succeeded}개 성공, ${result.failed}개 실패`,
        'success'
      );
    } catch (err) {
      console.error('Bulk embedding error:', err);
      addToast('대량 임베딩 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setBulkEmbeddingInProgress(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="벡터 임베딩 관리"
        actions={
          <button
            onClick={handleBulkEmbed}
            disabled={bulkEmbeddingInProgress}
            className={`px-4 py-2 rounded text-white ${
              bulkEmbeddingInProgress
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {bulkEmbeddingInProgress ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                처리 중...
              </span>
            ) : (
              '전체 임베딩 생성'
            )}
          </button>
        }
      />

      <AdminInfoCard
        title="벡터 임베딩이란?"
        description="벡터 임베딩은 포스트의 내용을 AI가 이해할 수 있는 숫자 벡터로 변환합니다. 이를 통해 유사한 포스트를 자동으로 추천할 수 있습니다. 포스트를 생성하거나 수정하면 자동으로 임베딩이 생성되지만, 수동으로 재생성할 수도 있습니다."
      />

      {bulkResult && <BulkEmbeddingResultPanel result={bulkResult} />}

      {showLoading && <AdminLoadingState />}

      {errorMessage && <AdminErrorState message={errorMessage} />}

      {!showLoading && !errorMessage && (
        <>
          <VectorsPostsTable
            posts={posts}
            embeddingInProgress={embeddingInProgress}
            bulkEmbeddingInProgress={bulkEmbeddingInProgress}
            onEmbedPost={handleEmbedPost}
          />
          <AdminPagination
            page={page}
            pageSize={pageSize}
            totalCount={totalPosts}
            totalLabel="게시글"
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
}
