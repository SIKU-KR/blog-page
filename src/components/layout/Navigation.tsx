'use client';

import { usePathname } from 'next/navigation';
import NavigationShell from '@/components/layout/NavigationShell';
import type { NavItem } from '@/components/layout/NavigationShell';

interface NavigationProps {
  items: NavItem[];
  direction?: 'horizontal' | 'vertical';
  onItemClick?: () => void;
}

export type { NavItem };

export default function Navigation({
  items,
  direction = 'horizontal',
  onItemClick,
}: NavigationProps) {
  const pathname = usePathname();

  return (
    <NavigationShell
      items={items}
      pathname={pathname}
      direction={direction}
      onItemClick={onItemClick}
    />
  );
}
