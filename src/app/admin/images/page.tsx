'use client';

import { useState, useCallback } from 'react';
import AdminErrorState from '@/components/admin/common/AdminErrorState';
import AdminInfoCard from '@/components/admin/common/AdminInfoCard';
import useSWR from 'swr';
import AdminLoadingState from '@/components/admin/common/AdminLoadingState';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import ImageGridItem from '@/components/admin/images/ImageGridItem';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ConfirmModal } from '@/components/ui/Modal';
import { listImagesAction, deleteImageAction } from '@/lib/actions/images';
import type { StorageImage } from '@/lib/supabase/storage';

const fetchImages = async (): Promise<StorageImage[]> => {
  const result = await listImagesAction();
  if (!result.success) {
    throw new Error('Failed to fetch images');
  }
  return result.images;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export default function ImageGalleryPage() {
  useAuthGuard();
  const { addToast } = useToast();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const {
    data: images,
    error,
    isLoading,
    mutate,
  } = useSWR<StorageImage[]>('admin-images', fetchImages);

  const handleCopyMarkdown = useCallback(
    (image: StorageImage) => {
      const markdown = `![${image.name}](${image.url})`;
      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          addToast('마크다운 URL이 복사되었습니다.', 'success');
        })
        .catch(() => {
          addToast('복사에 실패했습니다.', 'error');
        });
    },
    [addToast]
  );

  const handleDelete = useCallback(
    async (image: StorageImage) => {
      const confirmed = await confirm({
        title: '이미지 삭제',
        message: `"${image.name}" 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
        confirmText: '삭제',
        cancelText: '취소',
      });

      if (!confirmed) return;

      setDeletingPath(image.path);
      try {
        const result = await deleteImageAction(image.path);
        if (result.success) {
          addToast('이미지가 삭제되었습니다.', 'success');
          mutate();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '이미지 삭제 중 오류가 발생했습니다.';
        addToast(message, 'error');
      } finally {
        setDeletingPath(null);
      }
    },
    [confirm, addToast, mutate]
  );

  return (
    <div>
      <AdminPageHeader
        title="이미지 관리"
        actions={
          <div className="text-sm text-gray-500">{images && `총 ${images.length}개의 이미지`}</div>
        }
      />

      <AdminInfoCard
        title="이미지 갤러리"
        description="업로드된 이미지를 관리합니다. 이미지를 클릭하면 마크다운 URL이 클립보드에 복사됩니다. 복사된 URL을 에디터에 붙여넣어 사용할 수 있습니다."
      />

      {isLoading && <AdminLoadingState />}

      {error && <AdminErrorState message="이미지를 불러오는 중 오류가 발생했습니다." />}

      {/* 빈 상태 */}
      {!isLoading && !error && images && images.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="mt-4 text-gray-500">업로드된 이미지가 없습니다.</p>
        </div>
      )}

      {!isLoading && !error && images && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map(image => (
            <ImageGridItem
              key={image.path}
              image={image}
              isDeleting={deletingPath === image.path}
              fileSizeLabel={image.size > 0 ? formatFileSize(image.size) : ''}
              onCopyMarkdown={handleCopyMarkdown}
              onDelete={handleDelete}
            />
          ))}
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
