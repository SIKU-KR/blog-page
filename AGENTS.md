# AGENTS.md

Instructions for AI coding agents operating in this repository.

## Project Overview

Next.js 15 blog frontend (bumsiku.kr) using React 19, TypeScript, TailwindCSS.
Communicates with backend API (`https://api.bumsiku.kr`) via BFF pattern (Next.js API routes).
Korean-only blog (no i18n).

## Build / Lint / Format Commands

```bash
npm run dev              # HTTP dev server (localhost:3000)
npm run dev:https        # HTTPS dev server (for auth cookie testing)
npm run build            # TypeScript type-check + production build
npm run lint             # ESLint (next/core-web-vitals + next/typescript)
npm run format           # Prettier auto-fix (src/**/*.{js,jsx,ts,tsx})
npm run format:check     # Prettier check only
```

There are no tests. No test framework is configured. `npm run build` is the primary verification command (runs type-checking).

## Source Layout

```
src/
  app/                  # App Router: pages, API routes, layouts
    (blog)/             # Route group for blog
    admin/              # Admin dashboard (protected)
    api/                # API route handlers (posts, auth, admin, upload, health, sitemap)
  features/             # Feature modules (posts, auth) - self-contained
  components/           # Shared UI components (admin/, layout/, ui/, pages/, sections/)
  shared/               # Cross-cutting: Zod schemas, CVA variants, SWR config, cn()
  lib/                  # API clients, services, DB (Drizzle), utilities
  hooks/                # Global custom hooks
  types/                # Global type definitions
```

## Code Style

### Formatting (Prettier - `.prettierrc`)

- Single quotes, semicolons, 2-space indent
- Trailing commas: `es5`
- Print width: 100
- Arrow parens: avoid (omit when single param)
- Bracket spacing: true

### TypeScript

- Strict mode enabled (`tsconfig.json`)
- Path alias: `@/*` maps to `./src/*` -- always use `@/` imports, never relative `../../`
- Use `const` arrow functions, not `function` declarations: `const toggle = () => {}`
- Derive types from Zod schemas via `z.infer<>` -- do not create standalone `interface` without a schema
- ESLint relaxations: `no-explicit-any: off`, `no-unused-vars: off`, `exhaustive-deps: off`

### Import Order (no blank lines between groups)

1. Directives: `'use client'` or `'use server'` (line 1)
2. React core: `import { useState, useEffect } from 'react'`
3. Next.js built-ins: `import Link from 'next/link'`
4. Third-party packages: `lucide-react`, `swr`, `zod`, etc.
5. Internal `@/` imports: types, shared, components, hooks, lib
6. Relative imports: `./SiblingComponent`

### Naming

- Event handlers: `handle` prefix (`handleClick`, `handleKeyDown`, `handleSubmit`)
- Hooks: `use` prefix (`useAuthGuard`, `useInfinitePosts`)
- Components: PascalCase, default export, file named same as component
- Utilities/hooks: camelCase, named exports

### Components and Styling

- Tailwind classes only -- no inline styles, no CSS modules (exception: `globals.css`)
- Use `cn()` from `@/shared/lib/cn` (clsx + tailwind-merge) for conditional classes
- CVA variants live in `shared/ui/variants/` -- use `buttonVariants`, `inputVariants`, etc.
- Icons: `lucide-react` exclusively
- Accessibility: include `tabIndex`, `aria-label`, `onKeyDown` handlers on interactive elements
- Use early returns for readability

### Barrel Exports

- Every feature subdirectory and shared module has `index.ts`
- Components: `export { default as PostItem } from './PostItem'`
- Hooks/utilities: `export * from './useInfinitePosts'`

## Architecture Patterns

### Feature Modules (`src/features/`)

Each feature (posts, auth) is a self-contained module with components/, hooks/, store/.
**Cross-feature imports are prohibited** -- share through `src/shared/`.

### API Client (`src/lib/api/`)

Singleton `APIClient` with dual Axios instances:

- `publicClient` (30s timeout, no auth)
- `adminClient` (60s timeout, JWT auto-injected via interceptor)

Import the unified api object:

```typescript
import { api } from '@/lib/api';
// api.posts, api.auth, api.ai, api.embedding, api.images, api.adminAuth
```

### Server Services (`src/lib/services/`)

Server-side business logic called from API routes: PostService, AIService, EmbeddingService,
ImageService, AuthService, SitemapService. DB: Drizzle ORM + PostgreSQL (Supabase).

### State Management

- **SWR** for server state (global config: `src/shared/lib/swr.ts`)
  - Query hooks: `features/posts/hooks/`
  - Always use mutation hooks (useCreatePost, useUpdatePost) -- never call `api.posts.create()` directly (SWR cache won't invalidate)
- **Zustand** for local UI state (`features/posts/store/editorStore.ts`)

### Error Handling in API Routes

Custom error classes in `src/lib/utils/validation.ts`: `ValidationError`, `NotFoundError`, `UnauthorizedError`.

Preferred: wrap handlers with `withErrorHandling()` HOF from `src/lib/utils/response.ts`:

```typescript
export const GET = withErrorHandling(async request => {
  const data = await SomeService.getData();
  return successResponse(data);
});
```

Response format:

- Success: `{ success: true, data: T, error: null }`
- Error: `{ success: false, data: null, error: { code: string, message: string } }`

For complex routes, manual try/catch with `instanceof` checks is acceptable.

### Authentication

Client-side JWT stored in `localStorage` key `'admin_token'`. Parsed with `jose`.
Admin routes protected by `useAuthGuard` hook (redirects to `/login` on missing/expired token).
401 responses trigger automatic logout via SWR global error handler.

### Routing

- `app/(blog)/page.tsx` -- Home (infinite scroll post list)
- `app/(blog)/[slug]/page.tsx` -- Post detail
- `app/admin/` -- Admin dashboard (CRUD, vectors, write/edit)
- Post URLs are `/:slug` (not `/posts/:slug` -- 301 redirect configured in `next.config.mjs`)

## Common Pitfalls

- Do NOT import across features -- use `shared/` for cross-cutting concerns
- Do NOT call api methods directly for mutations -- use SWR mutation hooks
- Do NOT define types with bare `interface` -- use Zod schemas with `z.infer<>`
- Do NOT use CSS/style attributes -- use Tailwind classes
- Do NOT leave TODO comments or placeholder code
- Post URLs are `/:slug`, not `/posts/:slug`
- `NEXT_PUBLIC_` prefix required for client-accessible env vars

## Environment

- `NEXT_PUBLIC_API_URL=https://api.bumsiku.kr`
- Production: `removeConsole` strips all console.\* calls
- `serverActions.bodySizeLimit`: 20MB (image uploads)
- Supabase Storage image domain: `*.supabase.co`
