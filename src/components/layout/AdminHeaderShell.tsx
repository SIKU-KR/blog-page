import Link from 'next/link';

interface AdminHeaderShellProps {
  pathname: string;
  isLoggedIn: boolean;
  username?: string;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onMobileMenuClose: () => void;
  onLogout: () => void;
  onMobileLogout: () => void;
}

const menuItems = [
  { label: '게시글 관리', path: '/admin/posts' },
  { label: '벡터 관리', path: '/admin/vectors' },
  { label: '이미지', path: '/admin/images' },
];

const AdminHeaderShell = ({
  pathname,
  isLoggedIn,
  username,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onMobileMenuClose,
  onLogout,
  onMobileLogout,
}: AdminHeaderShellProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/admin" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              블로그 관리자
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn && <span className="text-sm text-gray-700">{username || '대시보드'}</span>}
            <Link
              href="/"
              className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50"
              target="_blank"
            >
              사이트 방문
            </Link>
            <button
              onClick={onLogout}
              className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-md hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={onToggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
            {menuItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={onMobileMenuClose}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-3 mb-3">
                {isLoggedIn && (
                  <span className="text-sm text-gray-700">{username || '대시보드'}</span>
                )}
              </div>
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                target="_blank"
                onClick={onMobileMenuClose}
              >
                사이트 방문
              </Link>
              <button
                onClick={onMobileLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeaderShell;
