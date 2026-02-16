'use client';

import React from 'react';
import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
  onPageChange?: (page: number) => void;
}

const paginationStyles = {
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

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  className = '',
  onPageChange,
}: PaginationProps) {
  // 페이지가 한 페이지뿐이면 페이지네이션을 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  // URL 구성 헬퍼 함수
  const getPageUrl = (page: number) => {
    // 기본 URL에 물음표가 있는지 확인하여 적절한 연결자 추가
    const connector = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${connector}page=${page}`;
  };

  // 보여줄 페이지 버튼 계산 (최대 7개)
  const generatePageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 7) {
      // 총 페이지가 7개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 중앙에 현재 페이지 표시, 양쪽에 3개씩 (최대 7개)
      let startPage = Math.max(1, currentPage - 3);
      const endPage = Math.min(startPage + 6, totalPages);

      // 끝 페이지가 총 페이지보다 작으면 시작 페이지 조정
      if (endPage < totalPages) {
        startPage = Math.max(1, endPage - 6);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  const handlePageClick = (page: number, e: React.MouseEvent) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  return (
    <nav className={`flex justify-center ${className}`} aria-label="페이지 네비게이션">
      <div className="flex items-center space-x-2">
        {/* 이전 페이지 버튼 */}
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
        ) : onPageChange ? (
          <button
            onClick={(e: React.MouseEvent) => handlePageClick(currentPage - 1, e)}
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
          </button>
        ) : (
          <Link href={getPageUrl(currentPage - 1)} className={paginationStyles.arrowEnabled}>
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

        {/* 페이지 번호 버튼들 */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map(page => {
            return onPageChange ? (
              <button
                key={page}
                className={`${paginationStyles.pageBase} ${
                  page === currentPage ? paginationStyles.pageActive : paginationStyles.pageInactive
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
                onClick={(e: React.MouseEvent) => handlePageClick(page, e)}
              >
                {page}
              </button>
            ) : (
              <Link
                key={page}
                href={getPageUrl(page)}
                className={`${paginationStyles.pageBase} ${
                  page === currentPage ? paginationStyles.pageActive : paginationStyles.pageInactive
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
                onClick={(e: React.MouseEvent) => handlePageClick(page, e)}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* 다음 페이지 버튼 */}
        {currentPage === totalPages ? (
          <span className={paginationStyles.arrowDisabled} aria-disabled={true} tabIndex={-1}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        ) : onPageChange ? (
          <button
            onClick={(e: React.MouseEvent) => handlePageClick(currentPage + 1, e)}
            className={paginationStyles.arrowEnabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <Link href={getPageUrl(currentPage + 1)} className={paginationStyles.arrowEnabled}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </nav>
  );
}
