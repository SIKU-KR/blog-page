import type { PostSummary } from '@/types';

interface VectorsPostsTableProps {
  posts: PostSummary[];
  embeddingInProgress: number | null;
  bulkEmbeddingInProgress: boolean;
  onEmbedPost: (postId: number) => void;
}

export default function VectorsPostsTable({
  posts,
  embeddingInProgress,
  bulkEmbeddingInProgress,
  onEmbedPost,
}: VectorsPostsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              제목
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              작업
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
                  발행됨
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  onClick={() => onEmbedPost(post.id)}
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
                      처리 중...
                    </span>
                  ) : (
                    '임베딩 재생성'
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
