import { describe, expect, it, vi } from 'vitest';

import { PostsService } from '@/lib/api/posts';
import { logger } from '@/lib/utils/logger';
import { APIClient } from '@/lib/api/client';

type ClientRequest = APIClient['request'];

const createRequestMock = (payload: unknown): ClientRequest => {
  return vi.fn(async () => payload) as unknown as ClientRequest;
};

const createService = (requestImpl: ClientRequest) => {
  const client = {
    request: requestImpl,
  } as APIClient;

  return new PostsService(client);
};

describe('PostsService contract safeParse boundary', () => {
  it('returns parsed getList payload when fixture is valid', async () => {
    const validPayload = {
      content: [
        {
          id: 1,
          slug: 'hello-world',
          title: 'Hello',
          summary: 'World',
          state: 'published' as const,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      totalElements: 1,
      pageNumber: 0,
      pageSize: 5,
    };
    const request = createRequestMock(validPayload);
    const service = createService(request);

    const result = await service.getList();

    expect(result).toEqual(validPayload);
  });

  it('falls back to raw payload on invalid getList fixture without throwing', async () => {
    const invalidPayload = {
      content: 'not-an-array',
      totalElements: 1,
      pageNumber: 0,
      pageSize: 5,
    };
    const request = createRequestMock(invalidPayload);
    const service = createService(request);

    await expect(service.getList()).resolves.toBe(invalidPayload);
  });

  it('keeps admin list behavior and logs validation issues in development only', async () => {
    const invalidPayload = {
      content: [
        {
          id: 1,
          slug: 'admin-post',
          title: 'Admin Post',
          summary: null,
          state: 'archived',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      totalElements: 1,
      pageNumber: 0,
      pageSize: 10,
    };
    const request = createRequestMock(invalidPayload);
    const service = createService(request);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    vi.stubEnv('NODE_ENV', 'development');
    await expect(service.getAdminList()).resolves.toBe(invalidPayload);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'API 경계 계약 검증 실패 - 원본 응답으로 폴백',
      expect.objectContaining({
        contract: 'PostsService.getAdminList',
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
    expect(warnPayload.issues[0]?.path).toBe('content.0.state');

    warnSpy.mockClear();
    vi.stubEnv('NODE_ENV', 'production');
    await expect(service.getAdminList()).resolves.toBe(invalidPayload);
    expect(warnSpy).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });
});
