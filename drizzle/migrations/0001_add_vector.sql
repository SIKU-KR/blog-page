-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector index for cosine similarity search (IVFFlat)
-- Note: This index is best created after initial data load
-- For small datasets (<1000 rows), you can use HNSW instead for better performance
CREATE INDEX IF NOT EXISTS idx_posts_embedding ON posts
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
