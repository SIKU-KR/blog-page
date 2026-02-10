import { ReactNode } from 'react';

/**
 * Generic column definition for DataTable
 * @template T - The type of data items in the table
 */
export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
}

/**
 * Props for DataTable component
 * @template T - The type of data items, must have an optional id field
 */
export interface DataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
}

/**
 * Generic DataTable component with type safety
 * @template T - The type of data items in the table
 */
export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  error,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const allIds = data.map(item => item.id).filter((id): id is string | number => id != null);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const handleSelectOne = (id: string | number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const totalColumns = selectable ? columns.length + 1 : columns.length;

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th scope="col" className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label="전체 선택"
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={String(column.key)}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={totalColumns}
                className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
              >
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const itemId = item.id;
              const isSelected = itemId != null && selectedIds.includes(itemId);

              return (
                <tr key={itemId ?? index} className={isSelected ? 'bg-blue-50' : ''}>
                  {selectable && (
                    <td className="px-4 py-4 w-10">
                      {itemId != null && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          aria-label={`항목 ${itemId} 선택`}
                        />
                      )}
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={`${itemId ?? index}-${String(column.key)}`}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key as string] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
