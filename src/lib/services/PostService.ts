/**
 * Post Service
 * Business logic for post management with Drizzle ORM
 */
import { db, posts, type Post, type NewPost } from '@/lib/db';
import { eq, and, desc, asc, sql, ne, ilike } from 'drizzle-orm';
import {
  ValidationError,
  NotFoundError,
  validatePagination,
  validateSorting,
} from '@/lib/utils/validation';
import type { PaginatedResponse } from '@/lib/utils/response';

export interface PostListItem {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  state: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RelatedPost {
  id: number;
  slug: string;
  title: string;
  score: number;
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
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<PostListItem>> {
    const { page = 0, size = 10, sort = 'createdAt,desc' } = options;
    const { offset, orderFn, dbField } = this.validateAndGetParams({ page, size, sort });

    const postResults = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        summary: posts.summary,
        state: posts.state,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(and(...this.getPublishedConditions()))
      .orderBy(orderFn(posts[dbField]))
      .limit(size)
      .offset(offset);

    const totalElements = await this.countPublicPosts();

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
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    state?: string;
  }): Promise<PaginatedResponse<PostListItem>> {
    const { page = 0, size = 10, sort = 'createdAt,desc', search, state } = options;
    const { offset, orderFn, dbField } = this.validateAndGetParams({ page, size, sort });

    const conditions: ReturnType<typeof eq>[] = [];

    if (search) {
      conditions.push(ilike(posts.title, `%${search}%`));
    }

    if (state) {
      const now = new Date();
      if (state === 'draft') {
        conditions.push(eq(posts.state, 'draft'));
      } else if (state === 'published') {
        conditions.push(eq(posts.state, 'published'));
        conditions.push(sql`${posts.createdAt} <= ${now.toISOString()}`);
      } else if (state === 'scheduled') {
        conditions.push(eq(posts.state, 'published'));
        conditions.push(sql`${posts.createdAt} > ${now.toISOString()}`);
      }
    }

    const postResults = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        summary: posts.summary,
        state: posts.state,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(posts[dbField]))
      .limit(size)
      .offset(offset);

    const totalElements = await this.countAdminPosts(search, state);
    const now = new Date();

    const content: PostListItem[] = postResults.map(post => {
      let displayState = post.state;
      if (post.state === 'published' && new Date(post.createdAt) > now) {
        displayState = 'scheduled';
      }

      return {
        ...post,
        state: displayState,
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
   * Get post by slug
   */
  async getPostBySlug(slug: string): Promise<Post> {
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
      return post;
    }

    const post = await this.findPublishedBySlug(slug);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return post;
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
    createdAt?: string;
  }): Promise<Post> {
    const { title, content, summary, state, createdAt: requestedCreatedAt } = postData;

    let { slug } = postData;

    if (!slug) {
      slug = this.generateSlug(title);
    }

    // Check slug uniqueness
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
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
        .where(and(eq(posts.slug, slug), ne(posts.id, postId)))
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

    const [updated] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .returning();

    return updated;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<{ deleted: boolean; id: number }> {
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('Post not found');
    }

    await db.delete(posts).where(eq(posts.id, postId));

    return { deleted: true, id: postId };
  }

  // Private helper methods

  private getPublishedConditions() {
    const now = new Date().toISOString();
    return [eq(posts.state, 'published'), sql`${posts.createdAt} <= ${now}`];
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

  private async countPublicPosts(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...this.getPublishedConditions()));

    return result[0]?.count || 0;
  }

  private async countAdminPosts(search?: string, state?: string): Promise<number> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (search) {
      conditions.push(ilike(posts.title, `%${search}%`));
    }

    if (state) {
      const now = new Date();
      if (state === 'draft') {
        conditions.push(eq(posts.state, 'draft'));
      } else if (state === 'published') {
        conditions.push(eq(posts.state, 'published'));
        conditions.push(sql`${posts.createdAt} <= ${now.toISOString()}`);
      } else if (state === 'scheduled') {
        conditions.push(eq(posts.state, 'published'));
        conditions.push(sql`${posts.createdAt} > ${now.toISOString()}`);
      }
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
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

  private async findPublishedById(id: number): Promise<Post | null> {
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), ...this.getPublishedConditions()))
      .limit(1);

    return result[0] || null;
  }
}

export const postService = new PostService();
