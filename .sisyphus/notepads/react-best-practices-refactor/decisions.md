## 2026-02-17T02:43:00Z Task: initialization

- Keep auth storage model unchanged (`admin_token` in localStorage).
- No broad UI redesign; only targeted functional/a11y refactors.

## 2026-02-17 Task: SWR Admin-Only Redirect Policy

- Defined admin-only 401 redirect policy in `.sisyphus/specs/swr-admin-redirect.md`.
- Redirection to `/login` on 401 will be scoped to requests with `/api/admin` key prefix or when current pathname starts with `/admin`.
- Confirmed non-goal: `admin_token` localStorage model remains unchanged.

## 2026-02-17T12:04:00Z Task: Scope SWR 401 redirect to admin-only contexts

- Enforce redirect strictly on `status === 401`; remove message-based unauthorized matching to prevent false positives in public contexts.
- Apply case-insensitive prefix matching for both SWR key path and browser pathname checks.

## 2026-02-17T12:36:00Z Task: Final verification + boundary correctness sweep

- Treat lint as pass/fail by exit code; keep existing warning-only output unchanged in this task.
- Preserve strict client boundary for auth context by requiring `'use client'` at `src/features/auth/hooks/useAuth.tsx`.

## 2026-02-17T12:41:00Z Task: Scope cleanup follow-up

- Prioritize scope correctness over opportunistic formatting: keep only allowlisted files changed and restore all other touched `src/` files to `HEAD`.

## 2026-02-17T12:44:00Z Task: Targeted Prettier gate recovery

- Accept targeted formatting on the active 21-file baseline as a non-semantic fix required to pass `format:check` and unblock full gates.
