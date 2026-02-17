'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { clearToken, parseJwt, setToken, User } from '@/lib/api/auth';
import { api } from '@/lib/api/index';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
  loginWithSession: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 세션 데이터 정리
  const clearSessionData = useCallback(() => {
    clearToken();
    if (typeof window !== 'undefined') {
      document.cookie = 'JSESSIONID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setUser(null);
  }, []);

  // 로그아웃 함수
  const logout = useCallback(() => {
    try {
      // 서버에 로그아웃 요청 (필요한 경우)
      api.auth
        .logout()
        .catch(() => {
          // 에러가 발생해도 클라이언트 측 로그아웃은 진행
        })
        .finally(() => {
          clearSessionData();
          router.push('/login');
        });
    } catch {
      clearSessionData();
      router.push('/login');
    }
  }, [clearSessionData, router]);

  // 인증 상태 확인 함수
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.auth.checkSession();

      // New backend returns { valid, userId, expiresAt }
      if (response.valid) {
        // Create a minimal user object from the response
        const userData: User = {
          id: response.userId?.toString() || '',
          username: '', // Not provided by new backend
          email: '', // Not provided by new backend
          role: 'admin', // Assume admin for authenticated users
        };
        setUser(userData);
        return true;
      }
      return false;
    } catch {
      clearSessionData();
      return false;
    }
  }, [clearSessionData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const init = async () => {
      setIsLoading(true);
      try {
        await checkAuthStatus();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [checkAuthStatus]);

  const login = (token: string) => {
    setToken(token);
    const userData = parseJwt(token);

    if (userData) {
      setUser(userData);
    }
  };

  const loginWithSession = async (username: string, password: string) => {
    await api.auth.login(username, password);
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        loginWithSession,
        isLoading,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
