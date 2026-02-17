## 2026-02-17T02:43:00Z Task: initialization

- Plan focus is Next/React boundary correctness and code health.
- Minimal tests are required (Vitest + RTL), not a broad test stack.

## 2026-02-17T02:45:00Z Task: Standardize evidence capture

- Standardized evidence capture in .sisyphus/evidence/ using task-{N}-{slug}.txt naming.
- Capturing command output with the command itself as a header improves traceability.

## 2026-02-17T11:50:00Z Task: Add Vitest + RTL minimal harness

- Minimal harness works with `vitest run` in jsdom using `src/test/setup.ts` and `@testing-library/jest-dom/vitest`.
- `vitest.config.ts` alias mapping `@` -> `./src` is sufficient without extra plugins.
- A tiny alias probe test at `src/test/alias.test.tsx` validates both `@/` resolution and RTL matcher wiring.

## 2026-02-17T11:58:00Z Task: Add characterization tests for key hotspots

- Characterization coverage added in `src/test/` for input id/label linkage, auth token helpers, and markdown sanitization.
- `getToken()` behavior is explicitly locked for non-browser contexts (no `window`) and remains deterministic.
- `isTokenExpired()` behavior is locked against fixed-time expired and non-expired JWT payloads via `exp` claim.
- Markdown compile action currently strips `<script>` tags and embedded script content from rendered static HTML.

## 2026-02-17T12:01:00Z Task: Fix unstable Input IDs using useId

- Replaced `Math.random()` fallback id generation in `Input` with React `useId()` to keep rerender id stable while preserving explicit `id` precedence.
- Added characterization coverage for omitted `id` to lock label/input pairing stability across rerenders.

## 2026-02-17T12:04:00Z Task: Scope SWR 401 redirect to admin-only contexts

- Global SWR redirect behavior can be safely narrowed by combining request-key scope (`/api/admin`) with runtime pathname scope (`/admin`) while keeping a single shared config.
- Treating SWR `error` as unknown and reading `status` defensively avoids runtime throws when error objects are missing expected fields.
- Characterization tests around `swrConfig.onError` provide stable coverage for admin/public split without requiring component-level integration tests.

## 2026-02-17T12:10:00Z Task: Unify logout/token cleanup via Auth module

- `AdminHeader` should call `useAuth().logout()` directly to avoid duplicated cookie-only logout logic and keep logout behavior centralized.
- `useAuth` logout path should include `clearToken()` inside shared session cleanup so both success and failure paths of `api.auth.logout()` remove `admin_token` before redirect.
- A focused hook-level characterization test can verify the contract by asserting `clearToken()` invocation and `router.push('/login')` after triggering `logout()`.

## 2026-02-17T12:18:00Z Task: Fix AuthProvider initialization correctness + dependency hygiene

- `AuthProvider` mount initialization should directly await `checkAuthStatus()` and depend on the memoized callback (`[checkAuthStatus]`) instead of suppressing `react-hooks/exhaustive-deps`.
- Keeping an `isMounted` guard in the init effect prevents post-unmount `setIsLoading(false)` updates while preserving one-time mount behavior.
- Characterization coverage for auth initialization is stable by asserting both state transition (`isLoading -> idle`, `isLoggedIn -> true`) and single `checkSession` invocation after a short idle window.

## 2026-02-17T12:30:00Z Task: Refactor Admin Vectors page to SWR query hook (remove effect-fetch)

- Admin vectors list fetch can be migrated cleanly to `useSWR` with key `['posts', page, pageSize]` and `keepPreviousData` to avoid introducing new pagination state machinery.
- Existing loading/error/list branching remains intact by deriving `posts`, `totalPosts`, and an error message from SWR response state instead of local fetch effect state.

## 2026-02-17T12:26:00Z Task: Fix lint script for Next 16 CLI behavior

- On Next 16, `next lint` is no longer a valid subcommand in this repo setup and is interpreted as a directory argument (`.../blog/lint`).
- A minimal repo-safe replacement is running ESLint directly with legacy config enabled: `ESLINT_USE_FLAT_CONFIG=false`.
- Scoping lint to `src/**/*.{js,jsx,ts,tsx}` preserves the project's existing lint focus and avoids unrelated config-file lint failures.

## 2026-02-17T12:24:00Z Task: Harden ClientMarkdownRenderer against races + add sanitization regression

- A simple monotonic request-id guard (`latestRequestId`) in `ClientMarkdownRenderer` prevents stale async markdown compile completions from overwriting newer content.
- Existing markdown sanitization remains active and now has explicit characterization coverage for stripped inline event handlers (`onerror`) in raw HTML input.
- Race behavior is reliably characterizable by mocking `compileMarkdownAction` with deferred promises and resolving newer content before older content.

## 2026-02-17T13:00:00Z Task: Targeted console cleanup in touched hotspots

- Auth-related UI hooks/pages can safely remove success-path `console.log` calls without changing control flow or user-facing behavior.
- Keeping `console.error` in login failure path preserves actionable diagnostics while aligning with production `removeConsole` policy.

## 2026-02-17T12:36:00Z Task: Final verification + boundary correctness sweep

- Full gate (`format:check`, `lint`, `test`, `build`) is stable after applying only required fixes from this sweep.
- Explicitly marking `src/features/auth/hooks/useAuth.tsx` with `'use client'` hardens client/server boundary intent for auth context usage.
- Existing lint output remains warning-only (`@next/next/no-page-custom-font` in `src/app/layout.tsx`) and does not block CI exit status.

## 2026-02-17T12:41:00Z Task: Scope cleanup follow-up

- For strict scope control, revert all non-allowlisted `src/` files directly to `HEAD` before re-running verification.
- Keep the allowlisted refactor/test set intact and avoid introducing additional formatting-only churn.

## 2026-02-17T12:44:00Z Task: Targeted Prettier gate recovery

- Running Prettier write strictly against the exact files reported by `npm run format:check` restores format gate pass without semantic edits.
