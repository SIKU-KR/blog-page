'use client';

import { useState } from 'react';
import Link from 'next/link';
import Container from '../ui/Container';
import SocialLink from '../ui/SocialLink';

function MenuIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm py-4 px-6 fixed w-full top-0 z-10">
      <Container size="md" className="relative">
        <div className="flex justify-between items-center">
          {/* 로고 */}
          <Link
            href="/"
            className="text-2xl font-medium text-gray-800 font-mono"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            <span className="font-extrabold">Siku</span>.class
          </Link>

          {/* 데스크톱: 소셜 아이콘 */}
          <div className="hidden md:flex items-center space-x-4">
            <SocialLink type="github" href="https://github.com/SIKU-KR" label="GitHub" />
            <SocialLink type="linkedin" href="https://linkedin.com/in/siku-kr" label="LinkedIn" />
            <SocialLink
              type="instagram"
              href="https://www.instagram.com/bam_siku_/"
              label="Instagram"
            />
          </div>

          {/* 모바일: 햄버거 메뉴 버튼 */}
          <button
            type="button"
            onClick={handleToggleMenu}
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* 모바일: 드롭다운 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full mt-2 mx-4 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4">
              {/* 소셜 링크 */}
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-3">
                  Links
                </span>
                <div className="flex justify-center space-x-6">
                  <SocialLink
                    type="github"
                    href="https://github.com/SIKU-KR"
                    label="GitHub"
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  />
                  <SocialLink
                    type="linkedin"
                    href="https://linkedin.com/in/siku-kr"
                    label="LinkedIn"
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  />
                  <SocialLink
                    type="instagram"
                    href="https://www.instagram.com/bam_siku_/"
                    label="Instagram"
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* 모바일 메뉴 열렸을 때 배경 오버레이 */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[72px] bg-black/20 -z-10"
          onClick={handleCloseMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
