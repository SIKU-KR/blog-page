import { describe, expect, it, vi } from 'vitest';

describe('test network guard', () => {
  it('blocks unmocked fetch calls', async () => {
    await expect(fetch('https://api.bumsiku.kr/posts')).rejects.toThrow(
      '[test-network] Unexpected network request in tests'
    );
  });

  it('allows explicit fetch mocks per test', async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(new Response(null, { status: 204 }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await fetch('https://api.bumsiku.kr/posts');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(204);
  });
});
