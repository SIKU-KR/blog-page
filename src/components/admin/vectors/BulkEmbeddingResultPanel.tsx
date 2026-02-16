import type { BulkEmbeddingResult } from '@/lib/api/embedding';

interface BulkEmbeddingResultPanelProps {
  result: BulkEmbeddingResult;
}

export default function BulkEmbeddingResultPanel({ result }: BulkEmbeddingResultPanelProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">대량 임베딩 결과</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-2xl font-bold text-gray-900">{result.total}</div>
          <div className="text-sm text-gray-500">전체</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{result.succeeded}</div>
          <div className="text-sm text-gray-500">성공</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{result.failed}</div>
          <div className="text-sm text-gray-500">실패</div>
        </div>
      </div>

      {result.failed > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">실패한 항목:</h3>
          <div className="max-h-40 overflow-y-auto">
            {result.results
              .filter(item => !item.success)
              .map(item => (
                <div key={item.postId} className="text-sm text-red-600 py-1">
                  #{item.postId}: {item.error}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
