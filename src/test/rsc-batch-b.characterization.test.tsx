import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '@/components/pages/home';
import Pagination from '@/components/ui/Pagination';
import PaginationShell from '@/components/ui/PaginationShell';
import type { PostListResponse } from '@/types';
import { expectStructuralMatch } from './rsc-test-helpers';

const useInfinitePostsMock = vi.hoisted(() => vi.fn());
const homeShellPropsSpy = vi.hoisted(() => vi.fn());

vi.mock('@/features/posts/hooks', () => ({
  useInfinitePosts: useInfinitePostsMock,
}));

vi.mock('@/components/pages/home/HomePageShell', () => ({
  default: (props: {
    posts: PostListResponse['content'];
    totalElements: number;
    onLoadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
  }) => {
    homeShellPropsSpy(props);

    return (
      <button type="button" onClick={props.onLoadMore}>
        load-more
      </button>
    );
  },
}));

describe('Batch B RSC migration characterization', () => {
  const initialPosts: PostListResponse = {
    content: [],
    totalElements: 0,
    pageNumber: 0,
    pageSize: 5,
  };

  beforeEach(() => {
    useInfinitePostsMock.mockReset();
    homeShellPropsSpy.mockReset();
  });

  it('keeps home client wrapper loading behavior while splitting shell', () => {
    useInfinitePostsMock.mockReturnValue({
      posts: [],
      isLoading: true,
      size: 1,
      setSize: vi.fn(),
      isReachingEnd: false,
      isLoadingMore: false,
      totalElements: 0,
    });

    render(<HomePage initialPosts={initialPosts} />);

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    expect(homeShellPropsSpy).not.toHaveBeenCalled();
  });

  it('keeps home wrapper hook-driven behavior and shell prop contract', () => {
    const setSizeMock = vi.fn();
    const posts = [
      {
        id: 1,
        slug: 'batch-b',
        title: 'Batch B',
        summary: 'home split',
        state: 'published' as const,
        createdAt: '2026-02-17T00:00:00.000Z',
        updatedAt: '2026-02-17T00:00:00.000Z',
      },
    ];

    useInfinitePostsMock.mockReturnValue({
      posts,
      isLoading: false,
      size: 1,
      setSize: setSizeMock,
      isReachingEnd: true,
      isLoadingMore: undefined,
      totalElements: 7,
    });

    render(<HomePage initialPosts={initialPosts} />);

    expect(homeShellPropsSpy).toHaveBeenCalledTimes(1);
    expect(homeShellPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        posts,
        totalElements: 7,
        hasMore: false,
        isLoadingMore: false,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'load-more' }));

    expect(setSizeMock).toHaveBeenCalledTimes(1);
    const sizeUpdater = setSizeMock.mock.calls[0]?.[0] as ((value: number) => number) | undefined;
    expect(sizeUpdater?.(3)).toBe(4);
  });

  it('keeps pagination shell structure stable in link mode', () => {
    expectStructuralMatch(
      <PaginationShell currentPage={2} totalPages={3} baseUrl="/posts" className="mt-8" />,
      '<nav aria-label="페이지 네비게이션"><div><a href="/posts?page=1"><svg><path></path></svg></a><div><a href="/posts?page=1">1</a><a aria-current="page" href="/posts?page=2">2</a><a href="/posts?page=3">3</a></div><a href="/posts?page=3"><svg><path></path></svg></a></div></nav>',
      {
        ignoreAttributes: [
          'class',
          'fill',
          'stroke',
          'viewbox',
          'viewBox',
          'stroke-linecap',
          'strokeLinejoin',
          'stroke-linejoin',
          'strokeWidth',
          'stroke-width',
          'd',
        ],
        normalizeWhitespace: true,
      }
    );
  });

  it('keeps pagination wrapper behavior for interactive and link flows', () => {
    const onPageChange = vi.fn();

    const { rerender } = render(
      <Pagination currentPage={2} totalPages={4} baseUrl="/posts" onPageChange={onPageChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.queryByRole('link', { name: '3' })).not.toBeInTheDocument();

    rerender(<Pagination currentPage={2} totalPages={4} baseUrl="/posts" />);

    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('href', '/posts?page=3');
  });
});
