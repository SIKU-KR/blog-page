'use client';

import DataTable, { type Column, type DataTableProps } from '@/components/ui/DataTable';

export type { Column };

interface AdminTableProps<T extends { id?: string | number }> extends DataTableProps<T> {
  title?: string;
}

export default function AdminTable<T extends { id?: string | number }>({
  title,
  ...tableProps
}: AdminTableProps<T>) {
  return (
    <div>
      {title && <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>}
      <DataTable {...tableProps} />
    </div>
  );
}
