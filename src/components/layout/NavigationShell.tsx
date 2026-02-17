import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

export interface NavItem {
  label: string;
  path: string;
}

interface NavigationShellProps {
  items: NavItem[];
  pathname: string;
  direction?: 'horizontal' | 'vertical';
  onItemClick?: () => void;
}

const NavigationShell = ({
  items,
  pathname,
  direction = 'horizontal',
  onItemClick,
}: NavigationShellProps) => {
  return (
    <nav
      className={cn('flex gap-1', direction === 'vertical' ? 'flex-col' : 'flex-row items-center')}
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
};

export default NavigationShell;
