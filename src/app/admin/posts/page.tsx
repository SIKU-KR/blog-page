'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import ClientMarkdownRenderer from '@/components/ui/data-display/ClientMarkdownRenderer';
import { AdminPostSummary } from '@/types';
import { dateUtils } from '@/lib/utils/date';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAdminPosts, useAdminPost } from '@/features/posts/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { deletePostAction } from '@/lib/actions/posts';

type StateFilter = '' | 'published' | 'scheduled' | 'draft';

const postsPageStyles = {
  rowActionButton: 'px-3 py-1 text-white rounded',
  rowActionPreview: 'bg-gray-500 hover:bg-gray-600',
  rowActionEdit: 'bg-blue-500 hover:bg-blue-600',
  rowActionClone: 'bg-teal-500 hover:bg-teal-600',
  rowActionDelete: 'bg-red-500 hover:bg-red-600',
  searchInput:
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  filterButtonBase: 'px-3 py-2 text-sm rounded-md transition-colors',
  filterButtonActive: 'bg-blue-500 text-white',
  filterButtonInactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  pagerButtonBase: 'px-3 py-1 rounded',
  pagerButtonEnabled: 'bg-gray-200 hover:bg-gray-300',
  pagerButtonDisabled: 'bg-gray-300 cursor-not-allowed',
  modalOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
};

export default function PostsManagementPage() {
  useAuthGuard();
  const router = useRouter();
  const { addToast } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [previewPostId, setPreviewPostId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { posts, totalPosts, isLoading, error, mutate } = useAdminPosts(
    page,
    pageSize,
    debouncedSearch || undefined,
    stateFilter || undefined
  );

  const { post: previewPost, isLoading: previewLoading } = useAdminPost(previewPostId);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleStateFilterChange = (state: StateFilter) => {
    setStateFilter(state);
    setPage(0);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/posts/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: '게시글 삭제',
      message: '이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
    });

    if (!confirmed) return;

    try {
      await deletePostAction(id);
      addToast('게시글이 삭제되었습니다.', 'success');
      mutate();
    } catch (err) {
      console.error('게시글 삭제 중 오류 발생:', err);
      addToast('게시글을 삭제하는 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: '벌크 삭제',
      message: `선택한 ${selectedIds.length}개의 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
    });

    if (!confirmed) return;

    try {
      for (const id of selectedIds) {
        await deletePostAction(Number(id));
      }
      addToast(`${selectedIds.length}개의 게시글이 삭제되었습니다.`, 'success');
      setSelectedIds([]);
      mutate();
    } catch (err) {
      console.error('벌크 삭제 중 오류 발생:', err);
      addToast('일부 게시글 삭제에 실패했습니다.', 'error');
      mutate();
    }
  };

  const handleNewPost = () => {
    router.push('/admin/posts/write');
  };

  const handleClone = (id: number) => {
    router.push(`/admin/posts/write?clone=${id}`);
  };

  const handlePreview = (id: number) => {
    setPreviewPostId(id);
  };

  const stateStyles: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const stateLabels: Record<string, string> = {
    published: '발행됨',
    scheduled: '예약됨',
    draft: '임시저장',
  };

  const stateFilterOptions: { value: StateFilter; label: string }[] = [
    { value: '', label: '전체' },
    { value: 'published', label: '발행됨' },
    { value: 'scheduled', label: '예약됨' },
    { value: 'draft', label: '임시저장' },
  ];

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (post: AdminPostSummary) => (
        <div className="font-mono text-sm text-gray-600">{post.id}</div>
      ),
    },
    {
      key: 'state',
      label: '상태',
      render: (post: AdminPostSummary) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stateStyles[post.state] || stateStyles.draft}`}
        >
          {stateLabels[post.state] || post.state}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'TITLE',
      render: (post: AdminPostSummary) => (
        <div className="truncate font-medium max-w-md" title={post.title}>
          {post.title}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: '발행일',
      render: (post: AdminPostSummary) => (
        <span className="text-sm text-gray-600">{dateUtils.formatShort(post.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '관리',
      render: (post: AdminPostSummary) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handlePreview(post.id)}
            className={`${postsPageStyles.rowActionButton} ${postsPageStyles.rowActionPreview}`}
            title="미리보기"
          >
            미리보기
          </button>
          <button
            onClick={() => handleEdit(post.id)}
            className={`${postsPageStyles.rowActionButton} ${postsPageStyles.rowActionEdit}`}
          >
            수정
          </button>
          <button
            onClick={() => handleClone(post.id)}
            className={`${postsPageStyles.rowActionButton} ${postsPageStyles.rowActionClone}`}
            title="복제"
          >
            복제
          </button>
          <button
            onClick={() => handleDelete(post.id)}
            className={`${postsPageStyles.rowActionButton} ${postsPageStyles.rowActionDelete}`}
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">게시글 관리</h1>
        <button
          onClick={handleNewPost}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          새 게시글
        </button>
      </div>

      {/* Search + State Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="제목으로 검색..."
            className={postsPageStyles.searchInput}
          />
        </div>
        <div className="flex gap-1">
          {stateFilterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleStateFilterChange(option.value)}
              className={`${postsPageStyles.filterButtonBase} ${
                stateFilter === option.value
                  ? postsPageStyles.filterButtonActive
                  : postsPageStyles.filterButtonInactive
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm text-blue-700 font-medium">{selectedIds.length}개 선택됨</span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            선택 삭제
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            선택 해제
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={posts}
        isLoading={isLoading}
        error={error?.message ?? null}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {!isLoading && !error && (
        <div className="mt-4 flex justify-between items-center">
          <div>총 {totalPosts}개의 게시글</div>
          <div className="flex space-x-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className={`${postsPageStyles.pagerButtonBase} ${
                page === 0
                  ? postsPageStyles.pagerButtonDisabled
                  : postsPageStyles.pagerButtonEnabled
              }`}
            >
              이전
            </button>
            <span className="px-3 py-1">
              {page + 1} / {Math.max(1, Math.ceil(totalPosts / pageSize))}
            </span>
            <button
              disabled={(page + 1) * pageSize >= totalPosts}
              onClick={() => setPage(page + 1)}
              className={`${postsPageStyles.pagerButtonBase} ${
                (page + 1) * pageSize >= totalPosts
                  ? postsPageStyles.pagerButtonDisabled
                  : postsPageStyles.pagerButtonEnabled
              }`}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPostId !== null && (
        <div className={postsPageStyles.modalOverlay}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">미리보기</h3>
              <button
                onClick={() => setPreviewPostId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              {previewLoading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : previewPost ? (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">{previewPost.title}</h1>
                  {previewPost.summary && (
                    <p className="text-gray-600 italic border-l-4 border-gray-300 pl-4">
                      {previewPost.summary}
                    </p>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <ClientMarkdownRenderer content={previewPost.content} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">게시글을 찾을 수 없습니다.</div>
              )}
            </div>
          </div>
        </div>
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
