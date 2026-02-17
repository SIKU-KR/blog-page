/**
 * Environment variables with Zod validation
 * Ensures all required configuration is present and valid at runtime
 * Supports both custom env var names and Vercel-provided names
 */
import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database (Supabase PostgreSQL) - accepts multiple Vercel-provided names
  DATABASE_URL: z.string().min(1),

  // Authentication
  JWT_SECRET: z.string().min(32),
  PASSWORD_SALT: z.string().min(8),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().length(64), // SHA-256 hex

  // OpenAI (optional - AI features disabled without it)
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),

  // Application
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().min(1),
});

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
function getEnv(): Env {
  // Normalize Vercel-provided env var names before validation
  const envWithFallbacks = {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  };

  const parsed = envSchema.safeParse(envWithFallbacks);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

// Export validated environment
export const env = getEnv();

// Helper to get public environment variables (safe for client-side)
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
};
