import { describe, expect, it, vi } from 'vitest';

import { getToken, isTokenExpired } from '@/lib/api/auth';

const createToken = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

describe('auth token helper characterization', () => {
  it('returns null from getToken when window is unavailable', () => {
    vi.stubGlobal('window', undefined);

    expect(getToken()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('evaluates expired and non-expired token payloads via exp claim', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const nowSeconds = Math.floor(Date.now() / 1000);
    const nonExpiredToken = createToken({ exp: nowSeconds + 60 });
    const expiredToken = createToken({ exp: nowSeconds - 60 });

    expect(isTokenExpired(nonExpiredToken)).toBe(false);
    expect(isTokenExpired(expiredToken)).toBe(true);

    vi.useRealTimers();
  });
});
