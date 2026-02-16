import Image from 'next/image';
import type { StorageImage } from '@/lib/supabase/storage';

interface ImageGridItemProps {
  image: StorageImage;
  isDeleting: boolean;
  fileSizeLabel: string;
  onCopyMarkdown: (image: StorageImage) => void;
  onDelete: (image: StorageImage) => void;
}

export default function ImageGridItem({
  image,
  isDeleting,
  fileSizeLabel,
  onCopyMarkdown,
  onDelete,
}: ImageGridItemProps) {
  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => onCopyMarkdown(image)}
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
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            URL 복사
          </span>
        </div>
      </button>

      <div className="p-2">
        <p className="text-xs text-gray-700 truncate" title={image.name}>
          {image.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{fileSizeLabel}</span>
          <button
            type="button"
            onClick={() => onDelete(image)}
            disabled={isDeleting}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              isDeleting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
            }`}
            aria-label={`${image.name} 삭제`}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
