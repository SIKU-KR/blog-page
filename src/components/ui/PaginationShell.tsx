import Link from 'next/link';

interface PaginationShellProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
}

export const paginationStyles = {
  arrowDisabled:
    'inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 border-gray-200 text-gray-300 cursor-not-allowed',
  arrowEnabled:
    'inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 border-gray-200 text-gray-600 hover:text-black hover:border-black hover:bg-gray-50',
  pageBase:
    'inline-flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-medium transition-all duration-200',
  pageActive: 'bg-black text-white border-black',
  pageInactive:
    'border-gray-200 text-gray-700 hover:text-black hover:border-black hover:bg-gray-50',
};

const getPageUrl = (baseUrl: string, page: number) => {
  const connector = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${connector}page=${page}`;
};

const generatePageNumbers = (currentPage: number, totalPages: number) => {
  const pageNumbers = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }

  let startPage = Math.max(1, currentPage - 3);
  const endPage = Math.min(startPage + 6, totalPages);

  if (endPage < totalPages) {
    startPage = Math.max(1, endPage - 6);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return pageNumbers;
};

const PaginationShell = ({
  currentPage,
  totalPages,
  baseUrl,
  className = '',
}: PaginationShellProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  return (
    <nav className={`flex justify-center ${className}`} aria-label="페이지 네비게이션">
      <div className="flex items-center space-x-2">
        {currentPage === 1 ? (
          <span className={paginationStyles.arrowDisabled} aria-disabled={true} tabIndex={-1}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </span>
        ) : (
          <Link
            href={getPageUrl(baseUrl, currentPage - 1)}
            className={paginationStyles.arrowEnabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        )}

        <div className="flex items-center space-x-1">
          {pageNumbers.map(page => {
            return (
              <Link
                key={page}
                href={getPageUrl(baseUrl, page)}
                className={`${paginationStyles.pageBase} ${
                  page === currentPage ? paginationStyles.pageActive : paginationStyles.pageInactive
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {currentPage === totalPages ? (
          <span className={paginationStyles.arrowDisabled} aria-disabled={true} tabIndex={-1}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        ) : (
          <Link
            href={getPageUrl(baseUrl, currentPage + 1)}
            className={paginationStyles.arrowEnabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default PaginationShell;
