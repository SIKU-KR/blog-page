/**
 * Embedding Service
 * Vector embeddings using OpenAI and pgvector for similarity search
 */
import OpenAI from 'openai';
import { db, posts } from '@/lib/db';
import { eq, and, ne, sql } from 'drizzle-orm';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface RelatedPost {
  id: number;
  slug: string;
  title: string;
  similarity: number;
}

export interface EmbeddingResult {
  success: boolean;
  postId: number;
  error?: string;
}

export interface BulkEmbeddingResult {
  total: number;
  succeeded: number;
  failed: number;
  results: EmbeddingResult[];
}

export class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(title: string, content: string): Promise<number[]> {
    const textToEmbed = `${title}\n\n${content}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: textToEmbed,
        });

        if (!response.data?.[0]?.embedding) {
          throw new Error('Invalid response from OpenAI');
        }

        return response.data[0].embedding;
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_RETRIES - 1) {
          await this.delay(RETRY_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed to generate embedding');
  }

  /**
   * Index a post's embedding in the database
   */
  async indexPost(postId: number): Promise<EmbeddingResult> {
    try {
      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

      if (post.length === 0) {
        return { success: false, postId, error: 'Post not found' };
      }

      const embedding = await this.generateEmbedding(post[0].title, post[0].content);

      // Update embedding in database using raw SQL for vector type
      await db.execute(
        sql`UPDATE posts SET embedding = ${JSON.stringify(embedding)}::vector WHERE id = ${postId}`
      );

      return { success: true, postId };
    } catch (error) {
      return {
        success: false,
        postId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find similar posts using vector cosine similarity
   */
  async findSimilarPosts(
    postId: number,
    locale: string = 'ko',
    limit: number = 4
  ): Promise<RelatedPost[]> {
    try {
      // Get the embedding for the current post
      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

      if (post.length === 0) {
        return [];
      }

      const now = new Date().toISOString();

      // Use the search_similar_posts RPC function
      const result = await db.execute(sql`
        SELECT id, slug, title,
               1 - (embedding <=> (SELECT embedding FROM posts WHERE id = ${postId})) as similarity
        FROM posts
        WHERE state = 'published'
          AND locale = ${locale}
          AND id != ${postId}
          AND embedding IS NOT NULL
          AND created_at <= ${now}
        ORDER BY embedding <=> (SELECT embedding FROM posts WHERE id = ${postId})
        LIMIT ${limit}
      `);

      return (result as unknown as Array<{ id: number; slug: string; title: string; similarity: number }>).map(
        row => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          similarity: row.similarity,
        })
      );
    } catch (error) {
      console.error('Failed to find similar posts:', error);
      return [];
    }
  }

  /**
   * Bulk index all posts
   */
  async bulkIndexPosts(): Promise<BulkEmbeddingResult> {
    const allPosts = await db
      .select({ id: posts.id, title: posts.title, content: posts.content })
      .from(posts);

    const results: EmbeddingResult[] = [];

    for (const post of allPosts) {
      // Add delay between requests to avoid rate limiting
      if (results.length > 0) {
        await this.delay(200);
      }

      const result = await this.indexPost(post.id);
      results.push(result);
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: allPosts.length,
      succeeded,
      failed,
      results,
    };
  }

  /**
   * Delete a post's embedding (sets to NULL)
   */
  async deletePostEmbedding(postId: number): Promise<boolean> {
    try {
      await db.execute(sql`UPDATE posts SET embedding = NULL WHERE id = ${postId}`);
      return true;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const embeddingService = new EmbeddingService();
