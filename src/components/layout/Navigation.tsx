'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';

export interface NavItem {
  label: string;
  path: string;
}

interface NavigationProps {
  items: NavItem[];
  direction?: 'horizontal' | 'vertical';
  onItemClick?: () => void;
}

export default function Navigation({
  items,
  direction = 'horizontal',
  onItemClick,
}: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex gap-1',
        direction === 'vertical' ? 'flex-col' : 'flex-row items-center'
      )}
    >
      {items.map(item => (
        <Link
          key={item.path}
          href={item.path}
          onClick={onItemClick}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === item.path
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
