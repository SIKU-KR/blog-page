'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api/index';
import { getToken, isTokenExpired } from '@/lib/api/auth';

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      router.push('/admin');
    }
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call new JWT-based login API
      await api.adminAuth.login({
        username: data.username,
        password: data.password,
      });

      // Token is automatically saved to localStorage by api.adminAuth.login()

      if (data.remember) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirect to admin page
      router.push('/admin');
    } catch (err: unknown) {
      console.error('[LoginPage] Login error:', err);
      const errorObj = err as { message?: string };
      setError(errorObj.message || '로그인에 실패했습니다. 사용자명과 비밀번호를 확인하세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">관리자 로그인</h1>
          <p className="mt-2 text-gray-600">계정 정보를 입력하여 로그인하세요</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="space-y-4">
            <Input
              label="사용자명"
              type="text"
              id="username"
              placeholder="관리자 ID를 입력하세요"
              error={errors.username?.message}
              disabled={isSubmitting}
              {...register('username', { required: '사용자명을 입력하세요' })}
            />

            <Input
              label="비밀번호"
              type="password"
              id="password"
              placeholder="비밀번호를 입력하세요"
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password', { required: '비밀번호를 입력하세요' })}
            />

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register('remember')}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                로그인 상태 유지
              </label>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  );
}
