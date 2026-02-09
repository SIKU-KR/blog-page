import { MetadataRoute } from 'next';
import { sitemapService } from '@/lib/services';
import { defaultMetadata } from '@/lib/metadata';
import { SITE_URL, normalizeSiteUrl } from '@/lib/site';
import { routing } from '@/i18n/routing';

// 주기적 갱신(Incremental Static Regeneration)
// SEO 최적화: 블로그 특성상 하루 1-2회 갱신이면 충분
// 3600초 = 1시간 (이전 5분은 너무 빈번했음)
export const revalidate = 3600;

// i18n alternates 생성 헬퍼 (영어 + x-default만)
function createAlternates(path: string = ''): Record<string, string> {
  return {
    en: normalizeSiteUrl(`/en${path || ''}`),
    'x-default': normalizeSiteUrl(path || '/'),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 기본 페이지 URL 설정 (config에서 읽기)
  const baseCandidate =
    ((defaultMetadata.metadataBase as URL | undefined)?.origin as string | undefined) || SITE_URL;
  const baseUrl = normalizeSiteUrl(baseCandidate);

  try {
    // DB에서 직접 사이트맵 데이터 조회
    const sitemapData = await sitemapService.getSitemapData();
    const sitemapPaths = sitemapData.map(entry => `/${entry.slug}`);

    const currentTime = new Date().toISOString();
    const entries: MetadataRoute.Sitemap = [];

    // 홈페이지 - 각 언어별로 생성
    for (const locale of routing.locales) {
      const isDefault = locale === routing.defaultLocale;
      entries.push({
        url: isDefault ? baseUrl : normalizeSiteUrl(`/${locale}`),
        lastModified: currentTime,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: {
          languages: createAlternates(),
        },
      });
    }

    // 백엔드에서 제공한 slug 경로들을 사이트맵에 추가
    // 각 포스트에 대해 모든 언어 버전 생성
    for (let index = 0; index < sitemapPaths.length; index++) {
      const path = sitemapPaths[index];
      // path는 '/{slug}' 형태

      // 최신 순서에 따른 우선순위 계산 (최신 글이 높은 우선순위)
      let priority = 0.7;
      if (index < 10) priority = 0.8;
      if (index < 5) priority = 0.9;

      const changeFrequency = index < 30 ? 'weekly' : 'monthly';

      // 각 언어별 URL 생성
      for (const locale of routing.locales) {
        const isDefault = locale === routing.defaultLocale;
        const url = isDefault ? normalizeSiteUrl(path) : normalizeSiteUrl(`/${locale}${path}`);

        entries.push({
          url,
          lastModified: currentTime,
          changeFrequency,
          priority,
          alternates: {
            languages: createAlternates(path),
          },
        });
      }
    }

    return entries;
  } catch (error) {
    // API 호출 실패 시 fallback 제공
    console.error('Failed to fetch sitemap from backend:', error);
    const fallbackNow = new Date().toISOString();

    // 기본 페이지들은 항상 포함 (각 언어별)
    const fallbackEntries: MetadataRoute.Sitemap = [];

    for (const locale of routing.locales) {
      const isDefault = locale === routing.defaultLocale;
      fallbackEntries.push({
        url: isDefault ? baseUrl : normalizeSiteUrl(`/${locale}`),
        lastModified: fallbackNow,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: {
          languages: createAlternates(),
        },
      });
    }

    return fallbackEntries;
  }
}
