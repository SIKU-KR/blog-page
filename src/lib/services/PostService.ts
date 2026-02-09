/**
 * Post Service
 * Business logic for post management with Drizzle ORM
 */
import { db, posts, tags, postTags, type Post, type NewPost } from '@/lib/db';
import { eq, and, desc, asc, sql, ne, isNull } from 'drizzle-orm';
import { ValidationError, NotFoundError, validatePagination, validateSorting } from '@/lib/utils/validation';
import type { PaginatedResponse } from '@/lib/utils/response';

export interface PostWithTags {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  state: string;
  locale: string;
  originalPostId: number | null;
  createdAt: Date;
  updatedAt: Date;
  views: number;
}

export interface PostListItem {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  tags: string[];
  state: string;
  locale: string;
  originalPostId: number | null;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  hasTranslation?: boolean;
}

export interface RelatedPost {
  id: number;
  slug: string;
  title: string;
  score: number;
}

export interface AvailableLocale {
  locale: string;
  slug: string;
}

export class PostService {
  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get public posts with pagination
   */
  async getPosts(options: {
    tag?: string | null;
    locale?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<PostListItem>> {
    const { tag = null, locale = 'ko', page = 0, size = 10, sort = 'createdAt,desc' } = options;

    // Validate pagination
    const paginationErrors = validatePagination({ page, size });
    if (paginationErrors.length > 0) {
      throw new ValidationError(paginationErrors.join(', '));
    }

    // Validate sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'views', 'title'];
    const sortErrors = validateSorting(sort, allowedSortFields);
    if (sortErrors.length > 0) {
      throw new ValidationError(sortErrors.join(', '));
    }

    const [sortField, sortDirection] = sort.split(',');
    const fieldMapping: Record<string, keyof typeof posts.$inferSelect> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      views: 'views',
      title: 'title',
    };
    const dbField = fieldMapping[sortField];
    const orderFn = sortDirection === 'asc' ? asc : desc;
    const offset = page * size;

    const now = new Date().toISOString();

    // Build query based on tag filter
    let postsQuery;
    if (tag) {
      postsQuery = db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          summary: posts.summary,
          state: posts.state,
          locale: posts.locale,
          originalPostId: posts.originalPostId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          views: posts.views,
        })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(
          and(
            eq(posts.state, 'published'),
            eq(posts.locale, locale),
            eq(tags.name, tag),
            sql`${posts.createdAt} <= ${now}`
          )
        )
        .orderBy(orderFn(posts[dbField]))
        .limit(size)
        .offset(offset);
    } else {
      postsQuery = db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          summary: posts.summary,
          state: posts.state,
          locale: posts.locale,
          originalPostId: posts.originalPostId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          views: posts.views,
        })
        .from(posts)
        .where(
          and(
            eq(posts.state, 'published'),
            eq(posts.locale, locale),
            sql`${posts.createdAt} <= ${now}`
          )
        )
        .orderBy(orderFn(posts[dbField]))
        .limit(size)
        .offset(offset);
    }

    const postResults = await postsQuery;

    // Get tags for each post
    const postIds = postResults.map(p => p.id);
    const tagsByPost = await this.getTagsForPosts(postIds);

    // Get total count
    const totalElements = await this.countPublicPosts(tag, locale);

    const content: PostListItem[] = postResults.map(post => ({
      ...post,
      tags: tagsByPost.get(post.id) || [],
    }));

    return {
      content,
      totalElements,
      pageNumber: page,
      pageSize: size,
    };
  }

  /**
   * Get admin posts with pagination (includes drafts and scheduled)
   */
  async getAdminPosts(options: {
    locale?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<PostListItem>> {
    const { locale, page = 0, size = 10, sort = 'createdAt,desc' } = options;

    const paginationErrors = validatePagination({ page, size });
    if (paginationErrors.length > 0) {
      throw new ValidationError(paginationErrors.join(', '));
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'views', 'title'];
    const sortErrors = validateSorting(sort, allowedSortFields);
    if (sortErrors.length > 0) {
      throw new ValidationError(sortErrors.join(', '));
    }

    const [sortField, sortDirection] = sort.split(',');
    const fieldMapping: Record<string, keyof typeof posts.$inferSelect> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      views: 'views',
      title: 'title',
    };
    const dbField = fieldMapping[sortField];
    const orderFn = sortDirection === 'asc' ? asc : desc;
    const offset = page * size;

    const conditions = locale ? [eq(posts.locale, locale)] : [];

    const postResults = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        summary: posts.summary,
        state: posts.state,
        locale: posts.locale,
        originalPostId: posts.originalPostId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        views: posts.views,
      })
      .from(posts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(posts[dbField]))
      .limit(size)
      .offset(offset);

    const postIds = postResults.map(p => p.id);
    const tagsByPost = await this.getTagsForPosts(postIds);

    // Get translation status
    const translatedIds = await this.getTranslatedOriginalIds(postIds);

    const totalElements = await this.countAdminPosts(locale);
    const now = new Date().toISOString();

    const content: PostListItem[] = postResults.map(post => {
      let displayState = post.state;
      if (post.state === 'published' && post.createdAt > now) {
        displayState = 'scheduled';
      }

      return {
        ...post,
        state: displayState,
        tags: tagsByPost.get(post.id) || [],
        hasTranslation: translatedIds.has(post.id),
      };
    });

    return {
      content,
      totalElements,
      pageNumber: page,
      pageSize: size,
    };
  }

  /**
   * Get post by slug with available locales
   */
  async getPostBySlug(
    slug: string,
    locale?: string
  ): Promise<
    | { redirect: true; slug: string; locale?: string }
    | { redirect: false; data: PostWithTags & { availableLocales: AvailableLocale[] } }
  > {
    if (!slug) {
      throw new ValidationError('Slug parameter is required');
    }

    // Check if it's a numeric ID
    const isNumericId = /^\d+$/.test(slug);

    if (isNumericId) {
      const post = await this.findPublishedById(parseInt(slug, 10));
      if (!post) {
        throw new NotFoundError('Post not found');
      }
      return { redirect: true, slug: post.slug, locale: post.locale };
    }

    // Find post by slug and locale
    let post = locale
      ? await this.findPublishedBySlugAndLocale(slug, locale)
      : await this.findPublishedBySlug(slug);

    // If not found with requested locale, try to find any version and redirect
    if (!post && locale) {
      const anyLocalePost = await this.findPublishedBySlug(slug);
      if (anyLocalePost) {
        const originalId = anyLocalePost.originalPostId || anyLocalePost.id;
        const translation = await this.findTranslation(originalId, locale);
        if (translation) {
          return { redirect: true, slug: translation.slug, locale: translation.locale };
        }
        post = anyLocalePost;
      }
    }

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const postTags = await this.getTagsForPost(post.id);

    // Get available locales
    const originalId = post.originalPostId || post.id;
    const allVersions = await this.findAllLanguageVersions(originalId);
    const availableLocales = allVersions.map(v => ({ locale: v.locale, slug: v.slug }));

    return {
      redirect: false,
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        summary: post.summary,
        tags: postTags,
        state: post.state,
        locale: post.locale,
        originalPostId: post.originalPostId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        views: post.views,
        availableLocales,
      },
    };
  }

  /**
   * Get post by ID (admin)
   */
  async getPostById(id: number): Promise<PostWithTags | null> {
    const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

    if (post.length === 0) {
      return null;
    }

    const postTags = await this.getTagsForPost(id);

    return {
      ...post[0],
      tags: postTags,
    };
  }

  /**
   * Create a new post
   */
  async createPost(postData: {
    slug?: string;
    title: string;
    content: string;
    summary: string;
    tags?: string[];
    state: string;
    locale?: string;
    originalPostId?: number | null;
    createdAt?: string;
  }): Promise<PostWithTags> {
    const {
      title,
      content,
      summary,
      tags: tagNames = [],
      state,
      locale = 'ko',
      originalPostId = null,
      createdAt: requestedCreatedAt,
    } = postData;

    let { slug } = postData;

    if (!slug) {
      slug = this.generateSlug(title);
    }

    // Check slug uniqueness within locale
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.locale, locale)))
      .limit(1);

    if (existing.length > 0) {
      throw new ValidationError('Slug already exists');
    }

    const now = new Date().toISOString();
    const createdAt = requestedCreatedAt ? new Date(requestedCreatedAt) : now;

    const [newPost] = await db
      .insert(posts)
      .values({
        slug,
        title,
        content,
        summary,
        state,
        locale,
        originalPostId,
        createdAt,
        updatedAt: now,
      })
      .returning();

    // Associate tags
    if (tagNames.length > 0) {
      await this.associateTags(newPost.id, tagNames);
    }

    return this.getPostById(newPost.id) as Promise<PostWithTags>;
  }

  /**
   * Update an existing post
   */
  async updatePost(
    postId: number,
    postData: {
      slug?: string;
      title: string;
      content: string;
      summary: string;
      tags?: string[];
      state: string;
      createdAt?: string;
    }
  ): Promise<PostWithTags> {
    const existing = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('Post not found');
    }

    const { slug, title, content, summary, tags: tagNames = [], state, createdAt } = postData;

    // Check slug uniqueness if changing
    if (slug) {
      const slugConflict = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.locale, existing[0].locale), ne(posts.id, postId)))
        .limit(1);

      if (slugConflict.length > 0) {
        throw new ValidationError('Slug already exists');
      }
    }

    const now = new Date().toISOString();
    const updateData: Partial<NewPost> = {
      title,
      content,
      summary,
      state,
      updatedAt: now,
    };

    if (slug) {
      updateData.slug = slug;
    }

    if (createdAt) {
      updateData.createdAt = new Date(createdAt);
    }

    await db.update(posts).set(updateData).where(eq(posts.id, postId));

    // Update tags
    await db.delete(postTags).where(eq(postTags.postId, postId));
    if (tagNames.length > 0) {
      await this.associateTags(postId, tagNames);
    }

    return this.getPostById(postId) as Promise<PostWithTags>;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<{ deleted: boolean; id: number }> {
    const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('Post not found');
    }

    await db.delete(posts).where(eq(posts.id, postId));

    return { deleted: true, id: postId };
  }

  /**
   * Increment post views
   */
  async incrementViews(postId: number): Promise<{ views: number }> {
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (post.length === 0) {
      throw new NotFoundError('Post not found');
    }

    // Increment views on original post (for unified view count)
    const targetId = post[0].originalPostId || postId;

    await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, targetId));

    const updated = await db.select({ views: posts.views }).from(posts).where(eq(posts.id, targetId)).limit(1);

    return { views: updated[0]?.views || 0 };
  }

  // Private helper methods

  private async associateTags(postId: number, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      // Find or create tag
      let tag = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);

      let tagId: number;
      if (tag.length === 0) {
        const [newTag] = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id });
        tagId = newTag.id;
      } else {
        tagId = tag[0].id;
      }

      await db.insert(postTags).values({ postId, tagId });
    }
  }

  private async getTagsForPost(postId: number): Promise<string[]> {
    const result = await db
      .select({ name: tags.name })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, postId))
      .orderBy(tags.name);

    return result.map(t => t.name);
  }

  private async getTagsForPosts(postIds: number[]): Promise<Map<number, string[]>> {
    if (postIds.length === 0) return new Map();

    const result = await db
      .select({ postId: postTags.postId, name: tags.name })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(sql`${postTags.postId} IN ${postIds}`);

    const tagsByPost = new Map<number, string[]>();
    for (const row of result) {
      if (!tagsByPost.has(row.postId)) {
        tagsByPost.set(row.postId, []);
      }
      tagsByPost.get(row.postId)!.push(row.name);
    }

    return tagsByPost;
  }

  private async getTranslatedOriginalIds(postIds: number[]): Promise<Set<number>> {
    if (postIds.length === 0) return new Set();

    const result = await db
      .selectDistinct({ originalPostId: posts.originalPostId })
      .from(posts)
      .where(sql`${posts.originalPostId} IN ${postIds}`);

    return new Set(result.filter(r => r.originalPostId !== null).map(r => r.originalPostId!));
  }

  private async countPublicPosts(tag: string | null, locale: string): Promise<number> {
    const now = new Date().toISOString();

    if (tag) {
      const result = await db
        .select({ count: sql<number>`count(distinct ${posts.id})` })
        .from(posts)
        .innerJoin(postTags, eq(posts.id, postTags.postId))
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(
          and(
            eq(posts.state, 'published'),
            eq(posts.locale, locale),
            eq(tags.name, tag),
            sql`${posts.createdAt} <= ${now}`
          )
        );
      return result[0]?.count || 0;
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(
        and(eq(posts.state, 'published'), eq(posts.locale, locale), sql`${posts.createdAt} <= ${now}`)
      );

    return result[0]?.count || 0;
  }

  private async countAdminPosts(locale?: string): Promise<number> {
    if (locale) {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.locale, locale));
      return result[0]?.count || 0;
    }

    const result = await db.select({ count: sql<number>`count(*)` }).from(posts);
    return result[0]?.count || 0;
  }

  private async findPublishedBySlug(slug: string): Promise<Post | null> {
    const now = new Date().toISOString();
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.state, 'published'), sql`${posts.createdAt} <= ${now}`))
      .limit(1);

    return result[0] || null;
  }

  private async findPublishedBySlugAndLocale(slug: string, locale: string): Promise<Post | null> {
    const now = new Date().toISOString();
    const result = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.locale, locale),
          eq(posts.state, 'published'),
          sql`${posts.createdAt} <= ${now}`
        )
      )
      .limit(1);

    return result[0] || null;
  }

  private async findPublishedById(id: number): Promise<Post | null> {
    const now = new Date().toISOString();
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), eq(posts.state, 'published'), sql`${posts.createdAt} <= ${now}`))
      .limit(1);

    return result[0] || null;
  }

  private async findTranslation(
    originalId: number,
    locale: string
  ): Promise<{ id: number; slug: string; locale: string } | null> {
    const result = await db
      .select({ id: posts.id, slug: posts.slug, locale: posts.locale })
      .from(posts)
      .where(and(eq(posts.originalPostId, originalId), eq(posts.locale, locale)))
      .limit(1);

    return result[0] || null;
  }

  private async findAllLanguageVersions(postId: number): Promise<{ id: number; slug: string; locale: string }[]> {
    // Get original and all translations
    const result = await db
      .select({ id: posts.id, slug: posts.slug, locale: posts.locale })
      .from(posts)
      .where(sql`${posts.id} = ${postId} OR ${posts.originalPostId} = ${postId}`);

    return result;
  }
}

export const postService = new PostService();
