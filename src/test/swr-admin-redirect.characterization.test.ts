import { afterEach, describe, expect, it, vi } from 'vitest';

import { swrConfig } from '@/shared/lib/swr';

const setMockWindow = (pathname: string) => {
  vi.stubGlobal('window', {
    location: {
      pathname,
      href: '/current',
    },
  });
};

const callOnError = (error: unknown, key: string) => {
  swrConfig.onError?.(error as Error, key, {} as never);
};

describe('SWR admin redirect policy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('redirects to login for admin API keys on 401 errors', () => {
    setMockWindow('/');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    callOnError({ status: 401 }, '/api/admin/posts');

    expect(window.location.href).toBe('/login');
  });

  it('redirects to login on admin path even for public API keys', () => {
    setMockWindow('/admin/posts');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    callOnError({ status: 401 }, '/api/posts/my-slug');

    expect(window.location.href).toBe('/login');
  });

  it('does not redirect for public key and public path when error is 401', () => {
    setMockWindow('/my-slug');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    callOnError({ status: 401 }, '/api/posts/my-slug');

    expect(window.location.href).toBe('/current');
  });

  it('tolerates errors without status or message fields', () => {
    setMockWindow('/admin/posts');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      callOnError({}, '/api/admin/posts');
      callOnError(null, '/api/admin/posts');
    }).not.toThrow();

    expect(window.location.href).toBe('/current');
  });
});
