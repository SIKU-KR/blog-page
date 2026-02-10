'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/index';
import { PostSummary } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { BulkEmbeddingResult } from '@/lib/api/embedding';

export default function VectorsManagementPage() {
  useAuthGuard();
  const { addToast } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const t = useTranslations('admin');

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // 임베딩 작업 상태
  const [embeddingInProgress, setEmbeddingInProgress] = useState<number | null>(null);
  const [bulkEmbeddingInProgress, setBulkEmbeddingInProgress] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkEmbeddingResult | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.posts.getList(page, pageSize);
      setPosts(response.content);
      setTotalPosts(response.totalElements);
      setError(null);
    } catch (err) {
      setError(t('loadPostError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleEmbedPost = async (postId: number) => {
    setEmbeddingInProgress(postId);
    try {
      const result = await api.embedding.embedPost(postId);
      if (result.success) {
        addToast(t('embedSuccess', { postId }), 'success');
      } else {
        addToast(t('embedFailed', { error: result.error ?? 'Unknown error' }), 'error');
      }
    } catch (err) {
      console.error('Embedding error:', err);
      addToast(t('embedError'), 'error');
    } finally {
      setEmbeddingInProgress(null);
    }
  };

  const handleBulkEmbed = async () => {
    const confirmed = await confirm({
      title: t('bulkEmbedConfirmTitle'),
      message: t('bulkEmbedConfirmMessage'),
      confirmText: t('generate'),
      cancelText: t('cancel'),
    });

    if (!confirmed) return;

    setBulkEmbeddingInProgress(true);
    setBulkResult(null);
    try {
      const result = await api.embedding.embedAllPosts();
      setBulkResult(result);
      addToast(
        t('bulkEmbedSuccess', {
          total: result.total,
          succeeded: result.succeeded,
          failed: result.failed,
        }),
        'success'
      );
    } catch (err) {
      console.error('Bulk embedding error:', err);
      addToast(t('bulkEmbedError'), 'error');
    } finally {
      setBulkEmbeddingInProgress(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('vectorManagement')}</h1>
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
              {t('processing')}
            </span>
          ) : (
            t('embedAll')
          )}
        </button>
      </div>

      {/* 설명 섹션 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">{t('vectorExplanationTitle')}</h2>
        <p className="text-blue-700 text-sm">{t('vectorExplanation')}</p>
      </div>

      {/* 대량 임베딩 결과 */}
      {bulkResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('bulkEmbeddingResult')}</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-2xl font-bold text-gray-900">{bulkResult.total}</div>
              <div className="text-sm text-gray-500">{t('total')}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{bulkResult.succeeded}</div>
              <div className="text-sm text-gray-500">{t('success')}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{bulkResult.failed}</div>
              <div className="text-sm text-gray-500">{t('failure')}</div>
            </div>
          </div>

          {/* 실패한 항목 목록 */}
          {bulkResult.failed > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-red-700 mb-2">{t('failedItems')}</h3>
              <div className="max-h-40 overflow-y-auto">
                {bulkResult.results
                  .filter(r => !r.success)
                  .map(r => (
                    <div key={r.postId} className="text-sm text-red-600 py-1">
                      {t('embedFailed', { error: `#${r.postId}: ${r.error}` })}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-gray-500"
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
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {/* 포스트 테이블 */}
      {!isLoading && !error && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('id')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('postTitle')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('state')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('task')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-600">{post.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-md">{post.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {t('published')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEmbedPost(post.id)}
                        disabled={embeddingInProgress === post.id || bulkEmbeddingInProgress}
                        className={`px-3 py-1 rounded text-sm ${
                          embeddingInProgress === post.id || bulkEmbeddingInProgress
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        }`}
                      >
                        {embeddingInProgress === post.id ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                            {t('processing')}
                          </span>
                        ) : (
                          t('regenerateEmbedding')
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {t('totalPosts', { count: totalPosts })}
            </div>
            <div className="flex space-x-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className={`px-3 py-1 rounded ${
                  page === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {t('prev')}
              </button>
              <span className="px-3 py-1">
                {page + 1} / {Math.max(1, Math.ceil(totalPosts / pageSize))}
              </span>
              <button
                disabled={(page + 1) * pageSize >= totalPosts}
                onClick={() => setPage(page + 1)}
                className={`px-3 py-1 rounded ${
                  (page + 1) * pageSize >= totalPosts
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {t('next')}
              </button>
            </div>
          </div>
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
