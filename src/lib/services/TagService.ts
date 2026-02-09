/**
 * Tag Service
 * Business logic for tag management with Drizzle ORM
 */
import { db, tags, postTags, posts } from '@/lib/db';
import { eq, and, gt, desc, sql } from 'drizzle-orm';

export interface TagResponse {
  id: number;
  name: string;
  postCount: number;
  createdAt: Date;
}

export class TagService {
  /**
   * Get all active tags (tags with at least one published post)
   */
  async getActiveTags(locale?: string): Promise<TagResponse[]> {
    const now = new Date().toISOString();

    // Get tags that have published posts in the specified locale
    let query;
    if (locale) {
      query = db
        .selectDistinct({
          id: tags.id,
          name: tags.name,
          postCount: tags.postCount,
          createdAt: tags.createdAt,
        })
        .from(tags)
        .innerJoin(postTags, eq(tags.id, postTags.tagId))
        .innerJoin(posts, eq(postTags.postId, posts.id))
        .where(
          and(
            eq(posts.state, 'published'),
            eq(posts.locale, locale),
            sql`${posts.createdAt} <= ${now}`,
            gt(tags.postCount, 0)
          )
        )
        .orderBy(desc(tags.postCount));
    } else {
      query = db
        .select()
        .from(tags)
        .where(gt(tags.postCount, 0))
        .orderBy(desc(tags.postCount));
    }

    const result = await query;

    return result.map(tag => ({
      id: tag.id,
      name: tag.name,
      postCount: tag.postCount,
      createdAt: tag.createdAt,
    }));
  }

  /**
   * Get all tags (admin)
   */
  async getAllTags(): Promise<TagResponse[]> {
    const result = await db.select().from(tags).orderBy(tags.name);

    return result.map(tag => ({
      id: tag.id,
      name: tag.name,
      postCount: tag.postCount,
      createdAt: tag.createdAt,
    }));
  }
}

export const tagService = new TagService();
