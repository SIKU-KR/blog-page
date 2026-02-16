import AdminModalShell from '@/components/admin/common/AdminModalShell';
import type { Draft } from '@/lib/utils/draft-storage';

interface DraftsModalProps {
  isOpen: boolean;
  drafts: Draft[];
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft: (draftId: string, draftTitle: string) => void;
  onDeleteAllDrafts: () => void;
  onClose: () => void;
}

export default function DraftsModal({
  isOpen,
  drafts,
  onLoadDraft,
  onDeleteDraft,
  onDeleteAllDrafts,
  onClose,
}: DraftsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <AdminModalShell containerClassName="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">임시저장된 글 목록</h3>

      <div className="space-y-3 mb-6">
        {drafts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>임시저장된 글이 없습니다.</p>
          </div>
        ) : (
          drafts.map(draft => (
            <div
              key={draft.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => onLoadDraft(draft)}>
                  <h4 className="font-medium text-gray-900 mb-1">{draft.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {draft.content
                      ? draft.content.substring(0, 100) + (draft.content.length > 100 ? '...' : '')
                      : '내용 없음'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(draft.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      onLoadDraft(draft);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    불러오기
                  </button>
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      onDeleteDraft(draft.id, draft.title);
                    }}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        {drafts.length > 0 && (
          <button
            onClick={onDeleteAllDrafts}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            모두 삭제
          </button>
        )}
        <div className={drafts.length > 0 ? '' : 'w-full flex justify-end'}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </AdminModalShell>
  );
}
