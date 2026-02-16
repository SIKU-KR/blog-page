import { dateUtils } from '@/lib/utils/date';
import type { Column } from '@/components/ui/DataTable';
import type { AdminPostSummary } from '@/types';
import { cn } from '@/shared/lib/cn';

type PostState = 'published' | 'scheduled' | 'draft';

const STATE_STYLES: Record<PostState, string> = {
  published: 'bg-green-100 text-green-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
};

const STATE_LABELS: Record<PostState, string> = {
  published: '발행됨',
  scheduled: '예약됨',
  draft: '임시저장',
};

interface PostsTableColumnsHandlers {
  onPreview: (id: number) => void;
  onEdit: (id: number) => void;
  onClone: (id: number) => void;
  onDelete: (id: number) => void;
}

export const createPostsTableColumns = ({
  onPreview,
  onEdit,
  onClone,
  onDelete,
}: PostsTableColumnsHandlers): Column<AdminPostSummary>[] => {
  return [
    {
      key: 'id',
      label: 'ID',
      render: post => <div className="font-mono text-sm text-gray-600">{post.id}</div>,
    },
    {
      key: 'state',
      label: '상태',
      render: post => {
        const state = (post.state as PostState) || 'draft';

        return (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              STATE_STYLES[state] ?? STATE_STYLES.draft
            )}
          >
            {STATE_LABELS[state] ?? post.state}
          </span>
        );
      },
    },
    {
      key: 'title',
      label: 'TITLE',
      render: post => (
        <div className="truncate font-medium max-w-md" title={post.title}>
          {post.title}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: '발행일',
      render: post => (
        <span className="text-sm text-gray-600">{dateUtils.formatShort(post.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '관리',
      render: post => (
        <div className="flex space-x-2">
          <button
            onClick={() => onPreview(post.id)}
            className="px-3 py-1 text-white rounded bg-gray-500 hover:bg-gray-600"
            title="미리보기"
          >
            미리보기
          </button>
          <button
            onClick={() => onEdit(post.id)}
            className="px-3 py-1 text-white rounded bg-blue-500 hover:bg-blue-600"
          >
            수정
          </button>
          <button
            onClick={() => onClone(post.id)}
            className="px-3 py-1 text-white rounded bg-teal-500 hover:bg-teal-600"
            title="복제"
          >
            복제
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="px-3 py-1 text-white rounded bg-red-500 hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      ),
    },
  ];
};

export type { PostState };
