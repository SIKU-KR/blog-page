'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import AdminHeaderShell from '@/components/layout/AdminHeaderShell';

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMobileLogout = () => {
    handleLogout();
    handleMobileMenuClose();
  };

  return (
    <AdminHeaderShell
      pathname={pathname}
      isLoggedIn={isLoggedIn}
      username={user?.username}
      isMobileMenuOpen={isMobileMenuOpen}
      onToggleMobileMenu={handleToggleMobileMenu}
      onMobileMenuClose={handleMobileMenuClose}
      onLogout={handleLogout}
      onMobileLogout={handleMobileLogout}
    />
  );
}
