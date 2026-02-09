-- RPC function for vector similarity search
-- Used by EmbeddingService.findSimilarPosts()

CREATE OR REPLACE FUNCTION search_similar_posts(
  query_embedding vector(1536),
  source_post_id bigint,
  target_locale varchar(5),
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id bigint,
  slug varchar,
  title varchar,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.title,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM posts p
  WHERE p.state = 'published'
    AND p.locale = target_locale
    AND p.id != source_post_id
    AND p.embedding IS NOT NULL
    AND p.created_at <= NOW()
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_similar_posts TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_posts TO service_role;
