import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from '@/features/auth';
import type { AuthSessionResponse } from '@/types';

const pushMock = vi.fn();
const logoutApiMock = vi.fn(() => Promise.resolve());
const checkSessionMock = vi.fn<() => Promise<AuthSessionResponse>>(() =>
  Promise.resolve({ valid: false })
);
const clearTokenMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/api/index', () => ({
  api: {
    auth: {
      logout: () => logoutApiMock(),
      checkSession: () => checkSessionMock(),
      login: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api/auth')>();

  return {
    ...actual,
    clearToken: () => clearTokenMock(),
  };
});

const LogoutProbe = () => {
  const { logout } = useAuth();

  return <button onClick={logout}>logout</button>;
};

const AuthInitProbe = () => {
  const { isLoading, isLoggedIn } = useAuth();

  return (
    <>
      <span data-testid="auth-loading">{isLoading ? 'loading' : 'idle'}</span>
      <span data-testid="auth-logged-in">{isLoggedIn ? 'true' : 'false'}</span>
    </>
  );
};

describe('useAuth logout characterization', () => {
  beforeEach(() => {
    pushMock.mockReset();
    logoutApiMock.mockReset();
    checkSessionMock.mockReset();
    clearTokenMock.mockReset();
    logoutApiMock.mockImplementation(() => Promise.resolve());
    checkSessionMock.mockResolvedValue({ valid: false });
  });

  it('clears admin_token and redirects to login after logout', async () => {
    render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(logoutApiMock).toHaveBeenCalledTimes(1);
      expect(clearTokenMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('runs auth status check on mount once without looping', async () => {
    checkSessionMock.mockResolvedValue({ valid: true, userId: 7 });

    render(
      <AuthProvider>
        <AuthInitProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('idle');
      expect(screen.getByTestId('auth-logged-in')).toHaveTextContent('true');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(checkSessionMock).toHaveBeenCalledTimes(1);
  });
});
