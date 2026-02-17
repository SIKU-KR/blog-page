import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSidebarShell from '@/components/admin/AdminSidebarShell';
import AdminHeader from '@/components/layout/AdminHeader';
import AdminHeaderShell from '@/components/layout/AdminHeaderShell';
import Navigation from '@/components/layout/Navigation';
import NavigationShell from '@/components/layout/NavigationShell';
import { expectStructuralMatch } from './rsc-test-helpers';

const logoutMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
let pathnameMock = '/admin';

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => useAuthMock(),
}));

describe('Batch C RSC migration characterization', () => {
  beforeEach(() => {
    pathnameMock = '/admin';
    logoutMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { username: '관리자' },
      isLoggedIn: true,
      logout: logoutMock,
    });
  });

  it('keeps admin chrome shell structures stable', () => {
    expectStructuralMatch(
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
      '<header><div><div><div><a href="/admin">블로그 관리자</a></div><div><a href="/admin/posts">게시글 관리</a><a href="/admin/vectors">벡터 관리</a><a href="/admin/images">이미지</a></div><div><span>관리자</span><a href="/" target="_blank">사이트 방문</a><button>로그아웃</button></div><div><button><svg><path></path></svg></button></div></div></div></header>',
      {
        ignoreAttributes: [
          'class',
          'id',
          'fill',
          'stroke',
          'viewbox',
          'viewBox',
          'stroke-linecap',
          'strokeLinecap',
          'strokeLinejoin',
          'stroke-linejoin',
          'strokeWidth',
          'stroke-width',
          'd',
        ],
        normalizeWhitespace: true,
      }
    );

    expectStructuralMatch(
      <AdminSidebarShell pathname="/admin/vectors" />,
      '<aside><div><h2>관리자 메뉴</h2><nav><a href="/admin">대시보드</a><a href="/admin/posts">게시글 관리</a><a href="/admin/vectors">벡터 관리</a></nav></div></aside>',
      { ignoreAttributes: ['class'], normalizeWhitespace: true }
    );

    expectStructuralMatch(
      <NavigationShell
        items={[
          { label: '대시보드', path: '/admin' },
          { label: '게시글 관리', path: '/admin/posts' },
        ]}
        pathname="/admin/posts"
        direction="vertical"
      />,
      '<nav><a href="/admin">대시보드</a><a href="/admin/posts">게시글 관리</a></nav>',
      { ignoreAttributes: ['class'], normalizeWhitespace: true }
    );
  });

  it('keeps AdminHeader wrapper active-state, logout flow, and mobile toggle behavior', () => {
    pathnameMock = '/admin/posts';

    const { container } = render(<AdminHeader />);

    const postsLinks = screen.getAllByRole('link', { name: '게시글 관리' });
    expect(postsLinks[0]).toHaveClass('bg-blue-100', 'text-blue-700');
    expect(screen.getByText('관리자')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: '로그아웃' })[0]);
    expect(logoutMock).toHaveBeenCalledTimes(1);

    const mobileToggleButton = container.querySelector('button.focus\\:ring-blue-500');
    expect(mobileToggleButton).not.toBeNull();

    fireEvent.click(mobileToggleButton as HTMLButtonElement);
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(2);

    fireEvent.click(mobileToggleButton as HTMLButtonElement);
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(1);

    fireEvent.click(mobileToggleButton as HTMLButtonElement);
    fireEvent.click(screen.getAllByRole('button', { name: '로그아웃' })[1]);
    expect(logoutMock).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(1);
  });

  it('keeps AdminSidebar wrapper active-state semantics', () => {
    pathnameMock = '/admin/posts/write';

    const { rerender } = render(<AdminSidebar />);

    expect(screen.getByRole('link', { name: '게시글 관리' })).toHaveClass(
      'bg-blue-100',
      'text-blue-700'
    );
    expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveClass('bg-blue-100');

    pathnameMock = '/admin';
    rerender(<AdminSidebar />);

    expect(screen.getByRole('link', { name: '대시보드' })).toHaveClass(
      'bg-blue-100',
      'text-blue-700'
    );
    expect(screen.getByRole('link', { name: '게시글 관리' })).not.toHaveClass('bg-blue-100');
  });

  it('keeps Navigation wrapper exact pathname matching and click handling', () => {
    const onItemClick = vi.fn();
    const items = [
      { label: '게시글 관리', path: '/admin/posts' },
      { label: '클릭', path: '#click' },
    ];

    pathnameMock = '/admin/posts/edit';

    const { rerender } = render(
      <Navigation items={items} direction="vertical" onItemClick={onItemClick} />
    );

    expect(screen.getByRole('link', { name: '게시글 관리' })).not.toHaveClass('bg-blue-100');

    pathnameMock = '/admin/posts';
    rerender(<Navigation items={items} direction="vertical" onItemClick={onItemClick} />);

    const postsLink = screen.getByRole('link', { name: '게시글 관리' });
    expect(postsLink).toHaveClass('bg-blue-100', 'text-blue-700');

    fireEvent.click(screen.getByRole('link', { name: '클릭' }));
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });
});
