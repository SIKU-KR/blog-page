import AdminModalShell from '@/components/admin/common/AdminModalShell';
import ClientMarkdownRenderer from '@/components/ui/data-display/ClientMarkdownRenderer';
import type { Post } from '@/types';

interface PostPreviewModalProps {
  post: Post | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function PostPreviewModal({ post, isLoading, onClose }: PostPreviewModalProps) {
  return (
    <AdminModalShell containerClassName="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">미리보기</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="미리보기 닫기"
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
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : post ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{post.title}</h1>
            {post.summary && (
              <p className="text-gray-600 italic border-l-4 border-gray-300 pl-4">{post.summary}</p>
            )}
            <div className="border-t border-gray-200 pt-4">
              <ClientMarkdownRenderer content={post.content} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">게시글을 찾을 수 없습니다.</div>
        )}
      </div>
    </AdminModalShell>
  );
}
