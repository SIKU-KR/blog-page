ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_public_read ON public.posts;
CREATE POLICY posts_public_read
ON public.posts
FOR SELECT
TO anon, authenticated
USING (state = 'published');

DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_public_read
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS comments_public_insert ON public.comments;
CREATE POLICY comments_public_insert
ON public.comments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(author_name)) > 0
  AND length(btrim(content)) > 0
);

DROP TABLE IF EXISTS public.post_tags;
DROP TABLE IF EXISTS public.tags;
