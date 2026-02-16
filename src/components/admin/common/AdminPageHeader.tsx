import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {actions ? actions : <div />}
    </div>
  );
}
