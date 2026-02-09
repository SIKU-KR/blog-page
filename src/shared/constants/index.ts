/**
 * Social links configuration
 * Used in Header, Footer, and HeroSection
 */
export const SOCIAL_LINKS = {
  github: 'https://github.com/SIKU-KR',
  linkedin: 'https://linkedin.com/in/siku-kr',
  notion: 'https://bam-siku.notion.site/Bumshik-Park-Software-Engineer-1458cfce4e32807b942bc95106e27ab8',
  email: 'peter012677@naver.com',
} as const;

/**
 * Site metadata
 */
export const SITE_CONFIG = {
  name: 'Siku.class',
  title: 'Siku 기술블로그',
  description: '소프트웨어 개발에 관한 기술 블로그입니다.',
  author: 'Siku',
} as const;

/**
 * Sort options for blog posts
 * Used in SortButton component
 */
export const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: '최신순' },
  { value: 'createdAt,asc', label: '오래된순' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

/**
 * Pagination defaults
 */
export const PAGINATION = {
  defaultPageSize: 10,
  adminPageSize: 10,
} as const;

/**
 * Editor configuration
 */
export const EDITOR_CONFIG = {
  autoSaveInterval: 30000, // 30 seconds
  maxDrafts: 10,
  maxTitleLength: 100,
  maxContentLength: 100000,
  maxSummaryLength: 200,
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  drafts: 'velog-drafts',
  adminToken: 'admin_token',
} as const;
