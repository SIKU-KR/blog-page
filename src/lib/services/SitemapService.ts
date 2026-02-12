/**
 * Sitemap Service
 * Generate sitemap data for SEO
 */
import { db, posts } from '@/lib/db';
import { eq, and, sql, desc } from 'drizzle-orm';

export interface SitemapEntry {
  slug: string;
  updatedAt: Date;
}

export class SitemapService {
  /**
   * Get all published posts for sitemap
   */
  async getSitemapData(): Promise<SitemapEntry[]> {
    const now = new Date().toISOString();

    const result = await db
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(and(eq(posts.state, 'published'), sql`${posts.createdAt} <= ${now}`))
      .orderBy(desc(posts.updatedAt));

    return result;
  }
}

export const sitemapService = new SitemapService();
