/**
 * Comment Service
 * Business logic for comment management with Drizzle ORM
 */
import { db, comments, posts } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { ValidationError, NotFoundError, validateCommentData } from '@/lib/utils/validation';

export interface CommentResponse {
  id: string;
  content: string;
  authorName: string;
  createdAt: Date;
  postId: number;
}

export class CommentService {
  /**
   * Get comments for a post (unified across translations)
   */
  async getCommentsByPostId(postId: number): Promise<CommentResponse[]> {
    // Verify post exists
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (post.length === 0) {
      throw new NotFoundError('Post not found');
    }

    // Get original post ID for unified comments
    const originalId = post[0].originalPostId || postId;

    // Fetch comments from the original post
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, originalId))
      .orderBy(comments.createdAt);

    return result.map(comment => ({
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      createdAt: comment.createdAt,
      postId: comment.postId,
    }));
  }

  /**
   * Create a new comment (always stored on original post)
   */
  async createComment(
    postId: number,
    data: { content?: unknown; author?: unknown }
  ): Promise<CommentResponse> {
    // Validate input
    const errors = validateCommentData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Verify post exists
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (post.length === 0) {
      throw new NotFoundError('Post not found');
    }

    // Get original post ID to store comment there
    const originalId = post[0].originalPostId || postId;

    // Create comment
    const [newComment] = await db
      .insert(comments)
      .values({
        postId: originalId,
        content: data.content as string,
        authorName: data.author as string,
      })
      .returning();

    return {
      id: newComment.id,
      content: newComment.content,
      authorName: newComment.authorName,
      createdAt: newComment.createdAt,
      postId: newComment.postId,
    };
  }

  /**
   * Delete a comment (admin only)
   */
  async deleteComment(commentId: string): Promise<{ deleted: boolean; id: string }> {
    // Verify comment exists
    const existing = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);

    if (existing.length === 0) {
      throw new NotFoundError('Comment not found');
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    return { deleted: true, id: commentId };
  }

  /**
   * Get all comments for admin
   */
  async getAllComments(): Promise<(CommentResponse & { postSlug: string; postTitle: string })[]> {
    const result = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorName: comments.authorName,
        createdAt: comments.createdAt,
        postId: comments.postId,
        postSlug: posts.slug,
        postTitle: posts.title,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .orderBy(comments.createdAt);

    return result;
  }
}

export const commentService = new CommentService();
