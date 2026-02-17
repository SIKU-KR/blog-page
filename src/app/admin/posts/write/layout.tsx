import { ReactNode } from 'react';

interface WriteLayoutProps {
  children: ReactNode;
}

export default function WriteLayout({ children }: WriteLayoutProps) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
