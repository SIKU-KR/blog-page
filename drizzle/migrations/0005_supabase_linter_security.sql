CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'vector'
      AND n.nspname <> 'extensions'
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tag_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tags SET post_count = post_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tags SET post_count = post_count - 1 WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_similar_posts(
  query_embedding extensions.vector(1536),
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
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.title,
    1 - (p.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public.posts p
  WHERE p.state = 'published'
    AND p.locale = target_locale
    AND p.id != source_post_id
    AND p.embedding IS NOT NULL
    AND p.created_at <= NOW()
  ORDER BY p.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
END;
$$;
