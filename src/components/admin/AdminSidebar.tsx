'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';

const menuItems = [
  { label: '대시보드', path: '/admin' },
  { label: '게시글 관리', path: '/admin/posts' },
  { label: '벡터 관리', path: '/admin/vectors' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-64 border-r border-gray-200 bg-white">
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">관리자 메뉴</h2>
        <nav className="flex flex-col gap-1">
          {menuItems.map(item => {
            const isActive =
              item.path === '/admin' ? pathname === '/admin' : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
