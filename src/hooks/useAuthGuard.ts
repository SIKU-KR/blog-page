'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isTokenExpired } from '@/lib/api/auth';

/**
 * Auth guard hook for protecting admin routes
 * Redirects to /login if no valid JWT token is found
 */
export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token || isTokenExpired(token)) {
      router.push('/login');
    }
  }, [router]);
}
