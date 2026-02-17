import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '@/lib/api/auth';
import { APIClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

type ClientRequest = APIClient['request'];

const createRequestMock = (payload: unknown): ClientRequest => {
  return vi.fn(async () => payload) as unknown as ClientRequest;
};

const createService = (requestImpl: ClientRequest) => {
  const client = {
    request: requestImpl,
  } as APIClient;

  return new AuthService(client);
};

describe('AuthService contract safeParse boundary', () => {
  it('returns parsed session payload when fixture is valid', async () => {
    const validPayload = {
      valid: true,
      userId: 42,
      expiresAt: '2026-12-31T23:59:59.000Z',
    };
    const request = createRequestMock(validPayload);
    const service = createService(request);

    const result = await service.checkSession();

    expect(result).toEqual(validPayload);
  });

  it('falls back to raw payload on invalid session fixture without throwing', async () => {
    const invalidPayload = {
      valid: 'yes',
      userId: 42,
    };
    const request = createRequestMock(invalidPayload);
    const service = createService(request);

    await expect(service.checkSession()).resolves.toBe(invalidPayload);
  });

  it('logs validation issues in development only', async () => {
    const invalidPayload = {
      valid: true,
      userId: '42',
    };
    const request = createRequestMock(invalidPayload);
    const service = createService(request);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    vi.stubEnv('NODE_ENV', 'development');
    await expect(service.checkSession()).resolves.toBe(invalidPayload);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'API 경계 계약 검증 실패 - 원본 응답으로 폴백',
      expect.objectContaining({
        contract: 'AuthService.checkSession',
        issueCount: expect.any(Number),
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            path: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      })
    );

    const warnPayload = warnSpy.mock.calls[0]?.[1] as {
      issueCount: number;
      issues: Array<{ path: string }>;
    };
    expect(warnPayload.issueCount).toBe(warnPayload.issues.length);
    expect(warnPayload.issues[0]?.path).toBe('userId');

    warnSpy.mockClear();
    vi.stubEnv('NODE_ENV', 'production');
    await expect(service.checkSession()).resolves.toBe(invalidPayload);
    expect(warnSpy).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });
});
