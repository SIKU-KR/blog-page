/**
 * Post Service
 * Business logic for post management with Drizzle ORM
 */
import { db, posts, type Post, type NewPost } from '@/lib/db';
import { eq, and, desc, asc, sql, ne } from 'drizzle-orm';
import { ValidationError, NotFoundError, validatePagination, validateSorting } from '@/lib/utils/validation';
import type { PaginatedResponse } from '@/lib/utils/response';

export interface PostListItem {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  state: string;
  locale: string;
  originalPostId: number | null;
  createdAt: Date;
  updatedAt: Date;
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

interface PostWithLocales extends Post {
  availableLocales: AvailableLocale[];
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
    locale?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<PostListItem>> {
    const { locale = 'ko', page = 0, size = 10, sort = 'createdAt,desc' } = options;
    const { offset, orderFn, dbField } = this.validateAndGetParams({ page, size, sort });

    const now = new Date().toISOString();

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
      })
      .from(posts)
      .where(
        and(
          eq(posts.locale, locale),
          ...this.getPublishedConditions()
        )
      )
      .orderBy(orderFn(posts[dbField]))
      .limit(size)
      .offset(offset);

    // Get total count
    const totalElements = await this.countPublicPosts(locale);

    return {
      content: postResults,
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
    const { offset, orderFn, dbField } = this.validateAndGetParams({ page, size, sort });

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
      })
      .from(posts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(posts[dbField]))
      .limit(size)
      .offset(offset);

    const postIds = postResults.map(p => p.id);
    const translatedIds = await this.getTranslatedOriginalIds(postIds);
    const totalElements = await this.countAdminPosts(locale);
    const now = new Date();

    const content: PostListItem[] = postResults.map(post => {
      let displayState = post.state;
      if (post.state === 'published' && new Date(post.createdAt) > now) {
        displayState = 'scheduled';
      }

      return {
        ...post,
        state: displayState,
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
    | { redirect: false; data: PostWithLocales }
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

    // Get available locales
    const originalId = post.originalPostId || post.id;
    const allVersions = await this.findAllLanguageVersions(originalId);
    const availableLocales = allVersions.map(v => ({ locale: v.locale, slug: v.slug }));

    return {
      redirect: false,
      data: {
        ...post,
        availableLocales,
      },
    };
  }

  /**
   * Get post by ID (admin)
   */
  async getPostById(id: number): Promise<Post | null> {
    const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

    if (post.length === 0) {
      return null;
    }

    return post[0];
  }

  /**
   * Create a new post
   */
  async createPost(postData: {
    slug?: string;
    title: string;
    content: string;
    summary: string;
    state: string;
    locale?: string;
    originalPostId?: number | null;
    createdAt?: string;
  }): Promise<Post> {
    const {
      title,
      content,
      summary,
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

    const now = new Date();
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

    return newPost;
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
      state: string;
      createdAt?: string;
    }
  ): Promise<Post> {
    const existing = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('Post not found');
    }

    const { slug, title, content, summary, state, createdAt } = postData;

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

    const now = new Date();
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

    const [updated] = await db.update(posts).set(updateData).where(eq(posts.id, postId)).returning();

    return updated;
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

  // Private helper methods

  private getPublishedConditions() {
    const now = new Date().toISOString();
    return [
      eq(posts.state, 'published'),
      sql`${posts.createdAt} <= ${now}`
    ];
  }

  private validateAndGetParams(options: { page: number; size: number; sort: string }) {
    const { page, size, sort } = options;

    const paginationErrors = validatePagination({ page, size });
    if (paginationErrors.length > 0) {
      throw new ValidationError(paginationErrors.join(', '));
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const sortErrors = validateSorting(sort, allowedSortFields);
    if (sortErrors.length > 0) {
      throw new ValidationError(sortErrors.join(', '));
    }

    const [sortField, sortDirection] = sort.split(',');
    const fieldMapping: Record<string, keyof typeof posts.$inferSelect> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      title: 'title',
    };

    return {
      offset: page * size,
      orderFn: sortDirection === 'asc' ? asc : desc,
      dbField: fieldMapping[sortField] || 'createdAt',
    };
  }

  private async getTranslatedOriginalIds(postIds: number[]): Promise<Set<number>> {
    if (postIds.length === 0) return new Set();

    const result = await db
      .selectDistinct({ originalPostId: posts.originalPostId })
      .from(posts)
      .where(sql`${posts.originalPostId} IN ${postIds}`);

    return new Set(result.filter(r => r.originalPostId !== null).map(r => r.originalPostId!));
  }

  private async countPublicPosts(locale: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(
        and(eq(posts.locale, locale), ...this.getPublishedConditions())
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
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), ...this.getPublishedConditions()))
      .limit(1);

    return result[0] || null;
  }

  private async findPublishedBySlugAndLocale(slug: string, locale: string): Promise<Post | null> {
    const result = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.locale, locale),
          ...this.getPublishedConditions()
        )
      )
      .limit(1);

    return result[0] || null;
  }

  private async findPublishedById(id: number): Promise<Post | null> {
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), ...this.getPublishedConditions()))
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
