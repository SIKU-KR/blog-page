'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">이미지 관리</h1>
        <div className="text-sm text-gray-500">
          {images && `총 ${images.length}개의 이미지`}
        </div>
      </div>

      {/* 설명 섹션 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">이미지 갤러리</h2>
        <p className="text-blue-700 text-sm">
          업로드된 이미지를 관리합니다. 이미지를 클릭하면 마크다운 URL이 클립보드에 복사됩니다. 복사된 URL을 에디터에 붙여넣어 사용할 수 있습니다.
        </p>
      </div>

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          이미지를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

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

      {/* 이미지 그리드 */}
      {!isLoading && !error && images && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map(image => (
            <div
              key={image.path}
              className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 이미지 썸네일 */}
              <button
                type="button"
                onClick={() => handleCopyMarkdown(image)}
                className="block w-full aspect-square relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-lg"
                aria-label={`${image.name} 마크다운 URL 복사`}
                tabIndex={0}
              >
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                  unoptimized
                />
                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    URL 복사
                  </span>
                </div>
              </button>

              {/* 이미지 정보 */}
              <div className="p-2">
                <p className="text-xs text-gray-700 truncate" title={image.name}>
                  {image.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    {image.size > 0 ? formatFileSize(image.size) : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(image)}
                    disabled={deletingPath === image.path}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      deletingPath === image.path
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                    }`}
                    aria-label={`${image.name} 삭제`}
                  >
                    {deletingPath === image.path ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
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
