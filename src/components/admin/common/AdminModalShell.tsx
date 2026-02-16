import type { ReactNode } from 'react';

interface AdminModalShellProps {
  children: ReactNode;
  containerClassName: string;
}

export default function AdminModalShell({ children, containerClassName }: AdminModalShellProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={containerClassName}>{children}</div>
    </div>
  );
}
