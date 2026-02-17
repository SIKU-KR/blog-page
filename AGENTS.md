# AGENTS.md

Guide for coding agents operating in this repository.

## Project Snapshot

- Stack: Next.js App Router, React 19, TypeScript, TailwindCSS
- Package manager: npm
- State: SWR (server state), Zustand (editor/local state)
- API helpers: `src/lib/utils/response.ts`
- Validation: Zod schemas + custom validation utilities

## Canonical Commands

Run from repo root: `/Users/peter_mac/Documents/blog`

### Development

```bash
npm run dev
npm run dev:https
```

- `dev`: local webpack dev server
- `dev:https`: local HTTPS dev server (cookie/auth testing)

### Build / Run

```bash
npm run build
npm run start
```

- `build`: production build (includes TS checks via Next build)
- `start`: serve production build

### Lint / Format

```bash
npm run lint
npm run format
npm run format:check
```

- Script scope: `src/**/*.{js,jsx,ts,tsx}`

### Test (Vitest)

```bash
npm run test
npm run test:coverage
```

Single test file:

```bash
npm run test -- src/test/alias.test.tsx
```

Single test by name:

```bash
npm run test -- src/test/alias.test.tsx -t "resolves @ alias"
```

Vitest details:

- Config: `vitest.config.ts`
- Include: `src/**/*.test.{ts,tsx}`
- Setup: `src/test/setup.ts`

## Repository Layout

```text
src/
  app/          # App Router pages, layouts, API routes
  components/   # Shared and page-level UI
  features/     # Feature modules (auth, posts)
  hooks/        # Reusable hooks
  lib/          # API client, services, server utilities
  shared/       # Shared schemas, config, helpers
  test/         # Vitest tests and setup
  types/        # Shared TypeScript types
```

High-signal paths:

- `src/app/api/**/route.ts`
- `src/lib/utils/response.ts`
- `src/lib/services/*`
- `src/features/posts/hooks/*`
- `src/features/posts/store/editorStore.ts`

## Code Style Guidelines

### Formatting (`.prettierrc`)

- `semi: true`
- `singleQuote: true`
- `tabWidth: 2`
- `trailingComma: "es5"`
- `printWidth: 100`
- `arrowParens: "avoid"`

### TypeScript (`tsconfig.json`)

- `strict: true`
- Path alias: `@/* -> ./src/*`
- `moduleResolution: "bundler"`
- Prefer explicit types at API/service/shared boundaries

### Imports

Observed order in app/component files:

1. React / Next imports
2. Third-party packages
3. Internal `@/` imports
4. Relative imports (if needed)
   Guidelines:

- Prefer `@/` for cross-directory imports
- Keep `'use client'` or `'use server'` as first statement when required

### Naming and Structure

- Components: PascalCase
- Hooks: `useXxx`
- Event handlers: `handleXxx`
- Store actions: verb-first (`setTitle`, `openPublishModal`, `reset`)
- Route handlers: `export const GET/POST/PATCH/DELETE`
- Prefer focused feature hooks/services over ad-hoc page logic

## API and Error Handling

Established route styles:

- Wrapper style: `withErrorHandling(async (...) => ...)`
- Manual style: `try/catch` + `errorResponse(...)`
  Reuse helpers from `src/lib/utils/response.ts`:
- `successResponse(data, status?)`
- `errorResponse(message, status?)`
  Current error response shape:

```json
{
  "success": false,
  "data": null,
  "error": { "code": 400, "message": "..." }
}
```

Validation notes:

- Custom errors: `src/lib/utils/validation.ts`
- `withErrorHandling` maps known validation/auth errors to HTTP status

## Lint Configuration Reality

- Base extends: `next/core-web-vitals` + `next/typescript`
- Disabled rules in `eslint.config.mjs`:
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/no-unused-vars`
  - `react-hooks/exhaustive-deps`
- Guidance: keep code typed and intentional even with relaxed lint rules

## Runtime Notes

- `reactStrictMode: true`
- Production strips `console.*` except `error` and `warn`
- Server Actions body limit: `20mb`
- Remote image host includes `*.supabase.co`
- Redirect: `/posts/:slug* -> /:slug*`

## Cursor / Copilot Rules Check

Checked and not found:

- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`
  If these are added later, treat them as higher-priority local instructions.
