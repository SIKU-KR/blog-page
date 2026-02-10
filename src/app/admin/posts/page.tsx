'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DataTable from '@/components/ui/DataTable';
import MarkdownRenderer from '@/components/ui/data-display/MarkdownRenderer';
import { AdminPostSummary } from '@/types';
import { dateUtils } from '@/lib/utils/date';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAdminPosts, useAdminPost } from '@/features/posts/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { deletePostAction, translatePostAction } from '@/lib/actions/posts';

type LocaleTab = 'ko' | 'en';
type StateFilter = '' | 'published' | 'scheduled' | 'draft';

export default function PostsManagementPage() {
  useAuthGuard();
  const router = useRouter();
  const { addToast } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const t = useTranslations('admin');

  const [activeTab, setActiveTab] = useState<LocaleTab>('ko');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [previewPostId, setPreviewPostId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { posts, totalPosts, isLoading, error, mutate } = useAdminPosts(
    activeTab,
    page,
    pageSize,
    debouncedSearch || undefined,
    stateFilter || undefined
  );

  const { post: previewPost, isLoading: previewLoading } = useAdminPost(previewPostId);

  const handleTabChange = (tab: LocaleTab) => {
    setActiveTab(tab);
    setPage(0);
    setSelectedIds([]);
  };

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
      title: t('deletePostTitle'),
      message: t('confirmDelete'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    });

    if (!confirmed) return;

    try {
      await deletePostAction(id);
      addToast(t('deleteSuccess'), 'success');
      mutate();
    } catch (err) {
      console.error('게시글 삭제 중 오류 발생:', err);
      addToast(t('deleteError'), 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: t('bulkDeleteTitle'),
      message: t('confirmBulkDelete', { count: selectedIds.length }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    });

    if (!confirmed) return;

    try {
      for (const id of selectedIds) {
        await deletePostAction(Number(id));
      }
      addToast(t('bulkDeleteSuccess', { count: selectedIds.length }), 'success');
      setSelectedIds([]);
      mutate();
    } catch (err) {
      console.error('벌크 삭제 중 오류 발생:', err);
      addToast(t('bulkDeleteError'), 'error');
      mutate();
    }
  };

  const handleTranslate = async (id: number) => {
    setTranslatingId(id);
    try {
      const result = await translatePostAction(id);
      if (result.success) {
        addToast(t('translateSuccess'), 'success');
        setActiveTab('en');
        setPage(0);
      }
    } catch (err) {
      console.error('번역 생성 중 오류 발생:', err);
      addToast(t('translateError'), 'error');
    } finally {
      setTranslatingId(null);
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
    published: t('published'),
    scheduled: t('scheduled'),
    draft: t('draft'),
  };

  const stateFilterOptions: { value: StateFilter; label: string }[] = [
    { value: '', label: t('all') },
    { value: 'published', label: t('published') },
    { value: 'scheduled', label: t('scheduled') },
    { value: 'draft', label: t('draft') },
  ];

  const columns = [
    {
      key: 'id',
      label: t('id'),
      render: (post: AdminPostSummary) => (
        <div className="font-mono text-sm text-gray-600">{post.id}</div>
      ),
    },
    {
      key: 'state',
      label: t('state'),
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
      label: t('title'),
      render: (post: AdminPostSummary) => (
        <div className="truncate font-medium max-w-md" title={post.title}>
          {post.title}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t('publishDate'),
      render: (post: AdminPostSummary) => (
        <span className="text-sm text-gray-600">{dateUtils.formatShort(post.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (post: AdminPostSummary) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handlePreview(post.id)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            title={t('preview')}
          >
            {t('preview')}
          </button>
          <button
            onClick={() => handleEdit(post.id)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('edit')}
          </button>
          <button
            onClick={() => handleClone(post.id)}
            className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600"
            title={t('clone')}
          >
            {t('clone')}
          </button>
          {activeTab === 'ko' && (
            <button
              onClick={() => handleTranslate(post.id)}
              disabled={translatingId === post.id || post.hasTranslation}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={post.hasTranslation ? t('alreadyTranslated') : t('translateToEnglish')}
            >
              {translatingId === post.id ? t('translating') : post.hasTranslation ? t('translated') : t('translate')}
            </button>
          )}
          <button
            onClick={() => handleDelete(post.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            {t('delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('postsManagement')}</h1>
        <button
          onClick={handleNewPost}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {t('newPost')}
        </button>
      </div>

      {/* Locale Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('ko')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ko'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('korean')}
          </button>
          <button
            onClick={() => handleTabChange('en')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'en'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('english')}
          </button>
        </nav>
      </div>

      {/* Search + State Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('searchPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          {stateFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStateFilterChange(option.value)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                stateFilter === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <span className="text-sm text-blue-700 font-medium">{t('selectedCount', { count: selectedIds.length })}</span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            {t('bulkDelete')}
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {t('clearSelection')}
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
          <div>{t('totalPosts', { count: totalPosts })}</div>
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
      )}

      {/* Preview Modal */}
      {previewPostId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('preview')}</h3>
              <button
                onClick={() => setPreviewPostId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              {previewLoading ? (
                <div className="text-center py-8 text-gray-500">{t('loading')}</div>
              ) : previewPost ? (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">{previewPost.title}</h1>
                  {previewPost.summary && (
                    <p className="text-gray-600 italic border-l-4 border-gray-300 pl-4">{previewPost.summary}</p>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <MarkdownRenderer content={previewPost.content} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t('postNotFound')}</div>
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
