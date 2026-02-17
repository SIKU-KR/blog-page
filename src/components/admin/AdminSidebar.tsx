'use client';

import { usePathname } from 'next/navigation';
import AdminSidebarShell from '@/components/admin/AdminSidebarShell';

export default function AdminSidebar() {
  const pathname = usePathname();

  return <AdminSidebarShell pathname={pathname} />;
}
