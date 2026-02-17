import { act, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import EditLayout from '@/app/admin/posts/edit/layout';
import WriteLayout from '@/app/admin/posts/write/layout';
import AdminSidebarShell from '@/components/admin/AdminSidebarShell';
import AdminTable from '@/components/admin/AdminTable';
import AdminHeaderShell from '@/components/layout/AdminHeaderShell';
import NavigationShell from '@/components/layout/NavigationShell';
import HomePageShell from '@/components/pages/home/HomePageShell';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PaginationShell from '@/components/ui/PaginationShell';
import PostItem from '@/features/posts/components/PostItem';

const HYDRATION_WARNING_PATTERN =
  /(hydration|did not match|server-rendered html|text content does not match|error while hydrating|mismatch)/i;

const pickHydrationWarnings = (calls: unknown[][]) => {
  return calls
    .map(call => call.map(value => String(value)).join(' '))
    .filter(message => HYDRATION_WARNING_PATTERN.test(message));
};

const expectNoHydrationWarningSignals = async (ui: ReactElement, label: string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  container.innerHTML = renderToString(ui);

  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot> | null = null;

  try {
    await act(async () => {
      root = hydrateRoot(container, ui);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const hydrationWarnings = [
      ...pickHydrationWarnings(errorSpy.mock.calls),
      ...pickHydrationWarnings(warnSpy.mock.calls),
    ];

    expect(hydrationWarnings, `${label} emitted hydration warning signals`).toEqual([]);
  } finally {
    await act(async () => {
      root?.unmount();
    });

    errorSpy.mockRestore();
    warnSpy.mockRestore();
    container.remove();
  }
};

describe('RSC hydration warning signal guard', () => {
  it('does not emit hydration warning signals for migrated components', async () => {
    const post = {
      id: 501,
      slug: 'hydration-guard-post',
      title: 'Hydration Guard Post',
      summary: 'RSC migration hydration audit',
      createdAt: '2026-02-17T00:00:00.000Z',
      updatedAt: '2026-02-17T00:00:00.000Z',
    };

    await expectNoHydrationWarningSignals(
      <EditLayout>
        <main>edit</main>
      </EditLayout>,
      'EditLayout'
    );

    await expectNoHydrationWarningSignals(
      <WriteLayout>
        <main>write</main>
      </WriteLayout>,
      'WriteLayout'
    );

    await expectNoHydrationWarningSignals(<Badge variant="primary">badge</Badge>, 'Badge');
    await expectNoHydrationWarningSignals(<Button>button</Button>, 'Button');
    await expectNoHydrationWarningSignals(<PostItem post={post} />, 'PostItem');

    await expectNoHydrationWarningSignals(
      <AdminTable title="table" columns={[{ key: 'title', label: '제목' }]} data={[]} />,
      'AdminTable'
    );

    await expectNoHydrationWarningSignals(
      <HomePageShell
        posts={[post]}
        totalElements={1}
        onLoadMore={() => {}}
        hasMore={false}
        isLoadingMore={false}
      />,
      'HomePageShell'
    );

    await expectNoHydrationWarningSignals(
      <PaginationShell currentPage={2} totalPages={5} baseUrl="/posts" />,
      'PaginationShell'
    );

    await expectNoHydrationWarningSignals(
      <AdminHeaderShell
        pathname="/admin/posts"
        isLoggedIn={true}
        username="관리자"
        isMobileMenuOpen={false}
        onToggleMobileMenu={() => {}}
        onMobileMenuClose={() => {}}
        onLogout={() => {}}
        onMobileLogout={() => {}}
      />,
      'AdminHeaderShell'
    );

    await expectNoHydrationWarningSignals(
      <AdminSidebarShell pathname="/admin/posts" />,
      'AdminSidebarShell'
    );

    await expectNoHydrationWarningSignals(
      <NavigationShell
        items={[
          { label: '대시보드', path: '/admin' },
          { label: '게시글 관리', path: '/admin/posts' },
        ]}
        pathname="/admin/posts"
      />,
      'NavigationShell'
    );
  });
});
