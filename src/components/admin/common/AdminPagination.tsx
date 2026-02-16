import { cn } from '@/shared/lib/cn';

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  totalLabel: string;
}

export default function AdminPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  totalLabel,
}: AdminPaginationProps) {
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const isPrevDisabled = page === 0;
  const isNextDisabled = (page + 1) * pageSize >= totalCount;

  return (
    <div className="mt-4 flex justify-between items-center">
      <div className="text-sm text-gray-600">
        총 {totalCount}개의 {totalLabel}
      </div>
      <div className="flex space-x-1">
        <button
          disabled={isPrevDisabled}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'px-3 py-1 rounded',
            isPrevDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
          )}
        >
          이전
        </button>
        <span className="px-3 py-1">
          {page + 1} / {maxPage}
        </span>
        <button
          disabled={isNextDisabled}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'px-3 py-1 rounded',
            isNextDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
          )}
        >
          다음
        </button>
      </div>
    </div>
  );
}
