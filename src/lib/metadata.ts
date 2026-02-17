// src/lib/metadata.ts
import { Metadata, Viewport } from 'next';
import { SITE_URL, normalizeSiteUrl } from './site';

// 기본 사이트 정보
const siteName = 'SIKU Tech Blog';
const defaultDescription = 'SIKU의 기술 블로그입니다.';
const defaultImagePath =
  'https://bumsiku-kr-images.s3.ap-northeast-2.amazonaws.com/default-image.png';
const defaultAuthor = 'Siku';
const siteMetadataBase = new URL(SITE_URL);

// 기본 메타데이터 설정
export const defaultMetadata: Metadata = {
  title: siteName,
  description: defaultDescription,
  metadataBase: siteMetadataBase,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/android-icon-192x192.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/favicon-96x96.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
      { rel: 'manifest', url: '/manifest.json' },
    ],
  },
  openGraph: {
    title: siteName,
    description: defaultDescription,
    url: SITE_URL,
    siteName: siteName,
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: defaultImagePath,
        width: 800,
        height: 600,
        alt: `${defaultAuthor} 프로필 이미지`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: defaultDescription,
    creator: '@siku',
    images: [defaultImagePath],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/ms-icon-144x144.png',
  },
};

// 기본 뷰포트 설정
export const defaultViewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// 홈페이지 메타데이터
export const homeMetadata: Metadata = {
  title: siteName,
  description: defaultDescription,
};

// 블로그 포스트 메타데이터 생성 함수 (slug 기반)
export function getPostMetadata(
  title: string,
  description: string,
  slug: string,
  canonicalPath: string,
  createdAt: string,
  updatedAt: string
): Metadata {
  const canonicalTarget = canonicalPath || `/${slug}`;
  const url = normalizeSiteUrl(canonicalTarget);

  return {
    title: `${title} | ${siteName}`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: createdAt,
      modifiedTime: updatedAt,
      authors: [defaultAuthor],
      siteName,
      images: [
        {
          url: defaultImagePath,
          width: 800,
          height: 600,
          alt: `${title} - ${siteName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@siku',
      images: [defaultImagePath],
    },
    authors: [{ name: defaultAuthor }],
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        datePublished: createdAt,
        dateModified: updatedAt,
        author: {
          '@type': 'Person',
          name: defaultAuthor,
        },
        description,
        mainEntityOfPage: url,
        publisher: {
          '@type': 'Organization',
          name: siteName,
          url: SITE_URL,
        },
      }),
    },
  };
}
