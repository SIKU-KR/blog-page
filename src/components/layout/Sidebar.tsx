'use client';

import React, { useState } from 'react';
import { cn } from '@/shared/lib/cn';

interface SidebarProps {
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  width?: string;
  className?: string;
}

export default function Sidebar({
  children,
  collapsible = false,
  defaultCollapsed = false,
  width = 'w-64',
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside
      className={cn(
        'border-r border-gray-200 bg-white overflow-y-auto',
        collapsed ? 'w-16' : width,
        'transition-all duration-200',
        className
      )}
    >
      {collapsible && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex justify-center"
          aria-label={collapsed ? '사이드바 열기' : '사이드바 닫기'}
        >
          <svg
            className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      )}
      {!collapsed && children}
    </aside>
  );
}
