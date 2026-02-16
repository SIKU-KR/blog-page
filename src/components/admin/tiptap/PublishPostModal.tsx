import AdminModalShell from '@/components/admin/common/AdminModalShell';
import { dateUtils } from '@/lib/utils/date';

interface PublishPostModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  summary: string;
  slug: string;
  scheduledAt: string | null;
  isSubmitting: boolean;
  isSummarizing: boolean;
  isGeneratingSlug: boolean;
  onSummaryChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onScheduledAtChange: (value: string | null) => void;
  onGenerateSummary: () => void;
  onGenerateSlug: () => void;
  onClose: () => void;
  onSave: () => void;
}

export default function PublishPostModal({
  isOpen,
  title,
  content,
  summary,
  slug,
  scheduledAt,
  isSubmitting,
  isSummarizing,
  isGeneratingSlug,
  onSummaryChange,
  onSlugChange,
  onScheduledAtChange,
  onGenerateSummary,
  onGenerateSlug,
  onClose,
  onSave,
}: PublishPostModalProps) {
  if (!isOpen) {
    return null;
  }

  const saveButtonLabel = isSubmitting
    ? scheduledAt
      ? '예약 중...'
      : '출간 중...'
    : scheduledAt
      ? '예약 발행'
      : '출간하기';

  return (
    <AdminModalShell containerClassName="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">포스트 출간</h3>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              요약 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={onGenerateSummary}
              disabled={isSummarizing || !content.trim()}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              {isSummarizing ? '생성 중...' : 'AI 요약 생성'}
            </button>
          </div>
          <textarea
            value={summary}
            onChange={event => onSummaryChange(event.target.value)}
            placeholder="포스트 요약을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              URL 주소 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={onGenerateSlug}
              disabled={isGeneratingSlug || !title.trim() || !content.trim()}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
            >
              {isGeneratingSlug ? '생성 중...' : 'AI slug 생성'}
            </button>
          </div>
          <input
            type="text"
            value={slug}
            onChange={event => onSlugChange(event.target.value.toLowerCase())}
            placeholder="url-friendly-slug"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
          />
          <div className="text-xs text-gray-500 mt-1">
            {slug && (
              <span className="text-green-600">
                미리보기: <code className="bg-gray-100 px-1 rounded">/{slug}</code>
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">발행 일시</label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishTiming"
                  checked={!scheduledAt}
                  onChange={() => onScheduledAtChange(null)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">즉시 발행</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishTiming"
                  checked={!!scheduledAt}
                  onChange={() => onScheduledAtChange(new Date().toISOString())}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">예약 발행</span>
              </label>
            </div>

            {scheduledAt && (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={dateUtils.toDatetimeLocal(scheduledAt)}
                  onChange={event =>
                    onScheduledAtChange(dateUtils.fromDatetimeLocal(event.target.value))
                  }
                  min={dateUtils.getMinDatetimeLocal()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <div className="text-xs text-blue-600">
                  예약 발행: {dateUtils.formatKorean(scheduledAt)}{' '}
                  {new Date(scheduledAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors order-2 sm:order-1"
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={isSubmitting || !summary.trim() || !slug.trim()}
          className="px-3 sm:px-4 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors order-1 sm:order-2"
        >
          {saveButtonLabel}
        </button>
      </div>
    </AdminModalShell>
  );
}
