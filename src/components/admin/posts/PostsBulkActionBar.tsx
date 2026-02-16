interface PostsBulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
}

export default function PostsBulkActionBar({
  selectedCount,
  onClear,
  onDelete,
}: PostsBulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <span className="text-sm text-blue-700 font-medium">{selectedCount}개 선택됨</span>
      <button
        onClick={onDelete}
        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
      >
        선택 삭제
      </button>
      <button onClick={onClear} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
        선택 해제
      </button>
    </div>
  );
}
