'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AdminPagination from '@/components/admin/common/AdminPagination';
import PostPreviewModal from '@/components/admin/posts/PostPreviewModal';
import PostsBulkActionBar from '@/components/admin/posts/PostsBulkActionBar';
import PostsFilterBar from '@/components/admin/posts/PostsFilterBar';
import { createPostsTableColumns } from '@/components/admin/posts/postsTableColumns';
import DataTable from '@/components/ui/DataTable';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAdminPosts, useAdminPost } from '@/features/posts/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { deletePostAction } from '@/lib/actions/posts';

type StateFilter = '' | 'published' | 'scheduled' | 'draft';

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
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

  const stateFilterOptions: { value: StateFilter; label: string }[] = [
    { value: '', label: '전체' },
    { value: 'published', label: '발행됨' },
    { value: 'scheduled', label: '예약됨' },
    { value: 'draft', label: '임시저장' },
  ];

  const columns = createPostsTableColumns({
    onPreview: handlePreview,
    onEdit: handleEdit,
    onClone: handleClone,
    onDelete: handleDelete,
  });

  return (
    <div>
      <AdminPageHeader
        title="게시글 관리"
        actions={
          <button
            onClick={handleNewPost}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            새 게시글
          </button>
        }
      />

      <PostsFilterBar
        searchTerm={searchTerm}
        stateFilter={stateFilter}
        stateFilterOptions={stateFilterOptions}
        onSearchChange={handleSearchChange}
        onStateFilterChange={handleStateFilterChange}
      />

      <PostsBulkActionBar
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds([])}
      />

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
        <AdminPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalPosts}
          totalLabel="게시글"
          onPageChange={setPage}
        />
      )}

      {previewPostId !== null && (
        <PostPreviewModal
          post={previewPost}
          isLoading={previewLoading}
          onClose={() => setPreviewPostId(null)}
        />
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
