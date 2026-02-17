import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    getAdminList: vi.fn(),
    useSWR: vi.fn(),
  };
});

vi.mock('swr', () => ({
  default: mocks.useSWR,
}));

vi.mock('@/lib/api/index', () => ({
  api: {
    posts: {
      getAdminList: mocks.getAdminList,
    },
  },
}));

import { useAdminPosts } from '@/features/posts/hooks/useAdminPosts';

describe('useAdminPosts SWR key policy', () => {
  beforeEach(() => {
    mocks.getAdminList.mockReset();
    mocks.useSWR.mockReset();
    mocks.getAdminList.mockResolvedValue({ content: [], totalElements: 0 });
    mocks.useSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
  });

  it('builds a deterministic key with all query-driving params including static sort', () => {
    useAdminPosts(2, 20, '', '');

    const [key] = mocks.useSWR.mock.calls[0] as [unknown, unknown, unknown];

    expect(key).toEqual([
      'admin-posts',
      {
        page: 2,
        pageSize: 20,
        search: null,
        sort: 'createdAt,desc',
        state: null,
      },
    ]);
  });

  it('passes normalized query params to fetcher to avoid key/request drift', async () => {
    useAdminPosts(0, 10, '', '');

    const [, fetcher] = mocks.useSWR.mock.calls[0] as [unknown, () => Promise<unknown>, unknown];

    await fetcher();

    expect(mocks.getAdminList).toHaveBeenCalledWith(0, 10, 'createdAt,desc', undefined, undefined);
  });
});
