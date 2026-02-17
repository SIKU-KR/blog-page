import { ReactNode } from 'react';

interface EditLayoutProps {
  children: ReactNode;
}

export default function EditLayout({ children }: EditLayoutProps) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
