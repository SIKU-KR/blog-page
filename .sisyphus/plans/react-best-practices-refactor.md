# React/Next Best Practices Refactor Plan (Repo-Grounded)

## TL;DR

> **Quick Summary**: Add a minimal test harness, then refactor a small set of high-leverage hotspots to improve Next.js server/client boundary correctness and code health without changing core architecture.
>
> **Deliverables**:
>
> - Vitest + React Testing Library (minimal) + `npm run test`
> - Fix unstable form input IDs (`Math.random`) → stable `useId`
> - Unify logout/token cleanup via Auth module (avoid cookie-only logout)
> - Re-enable/clean auth initialization + remove debug-only effect disable
> - Scope SWR global 401 redirect to admin-only contexts
> - Replace imperative effect-fetch in Admin Vectors with SWR query hook
> - Add a small markdown sanitization regression test + race-safety in renderer
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES (4 waves)
> **Critical Path**: Vitest setup → characterization tests → auth/SWR boundary fixes → admin vectors + markdown

---

## Context

### Original Request

React best practices를 학습하고, 이 프로젝트 안에서 리팩터링 아이디어를 찾아 실행 가능한 계획으로 정리.

### Interview Summary

- **Output**: 실행용 작업계획(이 파일)
- **Focus**: Next.js/React server-client boundary 정합성 + 코드 건강
- **Tests**: 최소 테스트 도입(= Vitest + 몇 개의 스모크/회귀 테스트)

### Evidence From Repo (verified)

- Unstable ID generation (a11y bug): `src/components/ui/Input.tsx` uses `Math.random()` for `id` fallback.
- Logout inconsistency: `src/components/layout/AdminHeader.tsx` clears cookies and routes to `/login` but does not call `useAuth().logout()`.
- Auth provider init is debug-skipped + disables exhaustive-deps: `src/features/auth/hooks/useAuth.tsx`.
- SWR global onError redirects to `/login` on 401 for all keys: `src/shared/lib/swr.ts`.
- Imperative effect-fetch in admin: `src/app/admin/vectors/page.tsx` uses `useEffect` + direct `api.posts.getList`.
- Markdown renderer injects HTML: `src/components/ui/data-display/ClientMarkdownRenderer.tsx` uses `dangerouslySetInnerHTML`; sanitization configured in `src/components/ui/data-display/mdx-options.ts`.

### Metis Review (gaps addressed by this plan)

- Add “characterization” tests before risky refactors; keep tests minimal (3–8 focused tests).
- Add explicit boundary correctness gates (`npm run build`) after each wave.
- Do not expand scope into auth storage redesign (cookies/sessions/middleware) unless explicitly approved.
- Add a markdown security regression test (e.g., `<script>` stripped) and clarify sanitization posture.

---

## Work Objectives

### Core Objective

Improve correctness and maintainability by tightening server/client boundaries, removing high-risk React anti-patterns, and adding minimal automated tests to prevent regressions.

### Concrete Deliverables

- Add `vitest`-based unit test harness and `npm run test`.
- Fix unstable IDs in `Input` (label → input association remains stable across re-renders).
- Make logout/token/session cleanup consistent via the Auth module.
- Ensure auth initialization runs reliably (no debug-only skip), with safe dependency management.
- Reduce unintended navigation by scoping SWR 401 redirects to admin-only contexts.
- Migrate Admin Vectors list fetch to SWR (remove effect-fetch pattern).
- Add markdown sanitization regression test + handle renderer race conditions.

### Definition of Done

- [x] `npm run lint` → PASS
- [x] `npm run format:check` → PASS
- [x] `npm run build` → PASS
- [x] `npm run test` → PASS (3–8 tests, deterministic)

### Must NOT Have (Guardrails)

- No change to token storage model (keep `localStorage` key `admin_token`) unless an explicit follow-up decision is made.
- No broad UI redesign; only functional or a11y-driven UI changes.
- No repo-wide console purge by default; only clean up logs in touched hotspots.
- No library swaps (keep SWR/Zustand; do not introduce TanStack Query).

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.
> Evidence saved to `.sisyphus/evidence/`.

### Test Decision

- **Infrastructure exists**: NO (currently no `test` script in `package.json`)
- **Automated tests**: YES (minimal)
- **Framework**: Vitest + React Testing Library + jsdom

### QA Policy

Every task includes agent-executed QA scenarios.

Global verification commands used throughout:

- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm run test`

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Foundation + characterization)
├── Task 1: Add Vitest + RTL + scripts/config
├── Task 2: Add characterization tests (Input id, auth token utils, markdown sanitization)
├── Task 3: Add boundary/QA harness conventions (evidence output helpers)
└── Task 4: Audit and document admin-only redirect policy for SWR (small change spec)

Wave 2 (High-leverage boundary + code health fixes)
├── Task 5: Fix `Input` unstable ID (useId) + test
├── Task 6: Unify logout to AuthProvider/logout + clearToken + remove cookie-only logout
├── Task 7: AuthProvider init correctness (remove debug skip; dependency hygiene)
└── Task 8: Scope SWR 401 redirect to admin-only keys/routes + tests

Wave 3 (Refactor effect-fetch hotspots + renderer safety)
├── Task 9: Refactor Admin Vectors posts list fetch to SWR query hook (remove useEffect fetch)
└── Task 10: ClientMarkdownRenderer race-safety + sanitization regression hardening

Wave 4 (Integration + cleanup)
├── Task 11: Targeted console cleanup in touched hotspots + lint/build/test gates
└── Task 12: Final refactor sweep for boundary correctness (no new scope)

Critical Path: 1 → 2 → 5/6/7/8 → 9/10 → 12

### Dependency Matrix

| Task | Depends On   | Blocks                     | Wave |
| ---- | ------------ | -------------------------- | ---- |
| 1    | —            | 2                          | 1    |
| 2    | 1            | 5,7,8,10                   | 1    |
| 3    | 1            | All (evidence consistency) | 1    |
| 4    | —            | 8                          | 1    |
| 5    | 2            | 12                         | 2    |
| 6    | 2            | 12                         | 2    |
| 7    | 2            | 12                         | 2    |
| 8    | 2,4          | 12                         | 2    |
| 9    | 2            | 12                         | 3    |
| 10   | 2            | 12                         | 3    |
| 11   | 5,6,7,8,9,10 | 12                         | 4    |
| 12   | 11           | FINAL                      | 4    |

---

## TODOs

> Implementation + tests (where applicable) are in the SAME task.
> Evidence files should be created under `.sisyphus/evidence/`.

- [x] 1. Add Vitest + RTL minimal test harness

  **What to do**:
  - Add devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and any minimal helpers needed for Next/router mocking.
  - Add `vitest.config.*` with:
    - tsconfig path alias support for `@/*` (see `tsconfig.json`)
    - jsdom environment for component tests
    - setup file registering `@testing-library/jest-dom`
  - Add `npm run test` script to `package.json`.

  **Must NOT do**:
  - Do not add Playwright/Cypress.
  - Do not add a large test framework stack or snapshot-heavy suite.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: test harness setup can be fiddly with Next + TS path aliases.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: not UI/visual work
    - `git-master`: no git history work required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 2
  - **Blocked By**: None

  **References**:
  - `package.json` - currently lacks `test` script; add one.
  - `tsconfig.json` - path alias `@/*` must work in tests.

  **Acceptance Criteria**:
  - [x] `npm run test` exists and runs Vitest.
  - [x] `npm run test` exits 0 with at least 1 trivial passing test.

  **QA Scenarios**:

  ```
  Scenario: Harness runs (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run test
      2. Save output: npm run test > .sisyphus/evidence/task-1-vitest-run.txt
    Expected Result: Exit code 0; output contains "passed".
    Evidence: .sisyphus/evidence/task-1-vitest-run.txt

  Scenario: Alias resolution works (failure/edge)
    Tool: Bash
    Steps:
      1. Add a tiny test importing `@/shared/lib/cn` (or similar) and running it.
      2. Run: npm run test > .sisyphus/evidence/task-1-alias.txt
    Expected Result: Import resolves; test passes (no module not found).
    Evidence: .sisyphus/evidence/task-1-alias.txt
  ```

- [x] 2. Add characterization tests for key hotspots

  **What to do**:
  - Add 3–5 focused tests that lock intended behavior:
    - Input label association stays stable across rerenders.
    - Token helpers: `getToken()` returns null on server; expired token detection behaves.
    - Markdown compile/sanitization: dangerous input does not produce `<script>`.

  **Must NOT do**:
  - Do not test backend-dependent flows.
  - Do not create brittle DOM snapshots.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: not UI design

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1
  - **Blocks**: 5,7,8,10
  - **Blocked By**: 1

  **References**:
  - `src/components/ui/Input.tsx` - current unstable id behavior to characterize.
  - `src/lib/api/auth.ts` - token helpers.
  - `src/lib/actions/markdown.ts` - markdown compilation entrypoint.
  - `src/components/ui/data-display/mdx-options.ts` - sanitization config.

  **Acceptance Criteria**:
  - [x] `npm run test` passes with 3–8 tests total.

  **QA Scenarios**:

  ```
  Scenario: Tests cover intended behavior (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run test > .sisyphus/evidence/task-2-tests.txt
    Expected Result: Exit code 0; at least 3 tests pass.
    Evidence: .sisyphus/evidence/task-2-tests.txt

  Scenario: Markdown XSS regression (failure)
    Tool: Bash
    Steps:
      1. Ensure there is a test that feeds markdown including <script>alert(1)</script>.
      2. Run: npm run test -t "markdown" > .sisyphus/evidence/task-2-markdown-xss.txt
    Expected Result: Compiled output does NOT contain "<script".
    Evidence: .sisyphus/evidence/task-2-markdown-xss.txt
  ```

- [x] 3. Standardize evidence capture helpers for QA

  **What to do**:
  - Add a tiny doc or helper convention (within `.sisyphus/` scope) describing evidence naming per task.
  - Ensure future tasks redirect CLI output to `.sisyphus/evidence/*` consistently.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - This plan's QA scenario templates.

  **Acceptance Criteria**:
  - [x] Directory exists: `.sisyphus/evidence/`
  - [x] Convention doc exists: `.sisyphus/evidence/README.md`

  **QA Scenarios**:

  ```
  Scenario: Evidence convention exists (happy path)
    Tool: Bash
    Steps:
      1. Create directory: mkdir -p .sisyphus/evidence
      2. Write `.sisyphus/evidence/README.md` describing naming: `task-{N}-{slug}.txt`
      3. Verify file exists: ls .sisyphus/evidence/README.md > .sisyphus/evidence/task-3-evidence-readme.txt
    Expected Result: File present.
    Evidence: .sisyphus/evidence/task-3-evidence-readme.txt

  Scenario: Convention used (failure)
    Tool: Bash
    Steps:
      1. List evidence directory: ls .sisyphus/evidence > .sisyphus/evidence/task-3-evidence-list.txt
    Expected Result: Naming pattern present.
    Evidence: .sisyphus/evidence/task-3-evidence-list.txt
  ```

- [x] 4. Specify SWR admin-only redirect policy

  **What to do**:
  - Decide and document policy: SWR global 401 redirect should apply only to admin-related SWR keys (e.g., keys prefixed `admin-`) and/or only when current pathname begins `/admin`.
  - Write this as a small spec to implement in Task 8: `.sisyphus/specs/swr-admin-redirect.md`.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 8
  - **Blocked By**: None

  **References**:
  - `src/shared/lib/swr.ts` - current global redirect logic.

  **Acceptance Criteria**:
  - [x] Spec exists: `.sisyphus/specs/swr-admin-redirect.md`
  - [x] Spec explicitly states: no auth storage change (keep `admin_token` in localStorage)

  **QA Scenarios**:

  ```
  Scenario: Policy recorded (happy path)
    Tool: Bash
    Steps:
      1. Create directory: mkdir -p .sisyphus/specs
      2. Write `.sisyphus/specs/swr-admin-redirect.md` with redirect rule + non-goals.
      3. Grep for rule keywords: grep -n "admin-" .sisyphus/specs/swr-admin-redirect.md > .sisyphus/evidence/task-4-policy.txt
    Expected Result: Clear rule written.
    Evidence: .sisyphus/evidence/task-4-policy.txt

  Scenario: No scope creep (failure)
    Tool: Bash
    Steps:
      1. Grep for guardrail keywords: grep -n "localStorage" .sisyphus/specs/swr-admin-redirect.md > .sisyphus/evidence/task-4-guardrail.txt
    Expected Result: Guardrail present.
    Evidence: .sisyphus/evidence/task-4-guardrail.txt
  ```

- [x] 5. Fix unstable `Input` IDs using `useId`

  **What to do**:
  - Replace `Math.random()`-based `inputId` with stable `useId()` fallback.
  - Keep behavior: if `id` prop provided, use it.
  - Ensure label `htmlFor` matches input `id`.

  **Must NOT do**:
  - Do not change visual styling, variants, or API unless needed.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 6,7,8)
  - **Blocks**: 11,12
  - **Blocked By**: 2

  **References**:
  - `src/components/ui/Input.tsx` - current `inputId` generation.

  **Acceptance Criteria**:
  - [x] Unit test demonstrates stable ID across rerender (from Task 2).
  - [x] `npm run build` passes.

  **QA Scenarios**:

  ```
  Scenario: Stable ID (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run test -t "Input" > .sisyphus/evidence/task-5-input.txt
    Expected Result: Test passes, no id mismatch.
    Evidence: .sisyphus/evidence/task-5-input.txt

  Scenario: Label association preserved (failure)
    Tool: Bash
    Steps:
      1. Ensure test fails if `id` changes across rerender (assert `label.htmlFor === input.id`).
      2. Run: npm run test -t "Input" > .sisyphus/evidence/task-5-input-assoc.txt
    Expected Result: Assertion remains true.
    Evidence: .sisyphus/evidence/task-5-input-assoc.txt
  ```

- [x] 6. Unify logout/token cleanup via Auth module

  **What to do**:
  - Update `AdminHeader` logout to call `useAuth().logout()`.
  - Ensure `logout()` clears the actual token (`localStorage` via `clearToken()`) and resets client state.
  - Keep any legacy cookie cleanup only inside AuthProvider if still required.

  **Must NOT do**:
  - Do not change auth storage (still `admin_token` in localStorage).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 11,12
  - **Blocked By**: 2

  **References**:
  - `src/components/layout/AdminHeader.tsx` - cookie-only logout.
  - `src/features/auth/hooks/useAuth.tsx` - `logout()` implementation.
  - `src/lib/api/auth.ts` - `clearToken()`.

  **Acceptance Criteria**:
  - [x] Logging out removes `admin_token` from localStorage.
  - [x] User is redirected to `/login`.

  **QA Scenarios**:

  ```
  Scenario: Logout clears token (happy path)
    Tool: Bash
    Steps:
      1. Run unit test that sets localStorage token, calls logout, asserts clear.
      2. npm run test -t "logout" > .sisyphus/evidence/task-6-logout.txt
    Expected Result: Token cleared; logout returns.
    Evidence: .sisyphus/evidence/task-6-logout.txt

  Scenario: Legacy cookies do not mask stale token (failure)
    Tool: Bash
    Steps:
      1. Ensure logout test fails if token remains.
      2. Run: npm run test -t "logout" > .sisyphus/evidence/task-6-logout-token.txt
    Expected Result: Token must be removed.
    Evidence: .sisyphus/evidence/task-6-logout-token.txt
  ```

- [x] 7. Fix AuthProvider initialization correctness + dependency hygiene

  **What to do**:
  - Remove debug-only skip in `AuthProvider` mount init; run `checkAuthStatus()`.
  - Remove `eslint-disable-next-line react-hooks/exhaustive-deps` and make dependencies correct.
  - Remove or gate console logs in this module (dev-only) as part of code health.

  **Must NOT do**:
  - Do not introduce middleware/cookie session architecture.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 11,12
  - **Blocked By**: 2

  **References**:
  - `src/features/auth/hooks/useAuth.tsx` - mount init currently skips auth check.

  **Acceptance Criteria**:
  - [x] Unit test covers: init calls checkAuthStatus, sets `isLoading` correctly.
  - [x] No exhaustive-deps disable remains in this file.

  **QA Scenarios**:

  ```
  Scenario: Init verifies auth (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run test -t "AuthProvider" > .sisyphus/evidence/task-7-auth-init.txt
    Expected Result: Test passes; checkAuthStatus invoked.
    Evidence: .sisyphus/evidence/task-7-auth-init.txt

  Scenario: No redirect loop trigger (failure)
    Tool: Bash
    Steps:
      1. Create a test where checkSession returns invalid; ensure logout/redirect does not repeatedly trigger.
      2. Run: npm run test -t "AuthProvider" > .sisyphus/evidence/task-7-auth-loop.txt
    Expected Result: Single logout/redirect call.
    Evidence: .sisyphus/evidence/task-7-auth-loop.txt
  ```

- [x] 8. Scope SWR 401 redirect to admin-only contexts

  **What to do**:
  - Implement policy from Task 4 in `src/shared/lib/swr.ts`:
    - Only auto-redirect to `/login` for admin-related SWR keys (e.g., key begins with `admin-`) and/or when pathname begins `/admin`.
    - Keep retry behavior (no retry on 401/404) as-is.
  - Ensure error objects without `status` do not cause crashes.

  **Must NOT do**:
  - Do not change public browsing flows.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 11,12
  - **Blocked By**: 2,4

  **References**:
  - `src/shared/lib/swr.ts` - current redirect logic is global.

  **Acceptance Criteria**:
  - [x] Unit tests cover: admin key 401 triggers redirect; public key 401 does not.
  - [x] `npm run build` passes.

  **QA Scenarios**:

  ```
  Scenario: Admin-only redirect (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run test -t "SWR" > .sisyphus/evidence/task-8-swr.txt
    Expected Result: Admin-key test asserts redirect; public-key test asserts no redirect.
    Evidence: .sisyphus/evidence/task-8-swr.txt

  Scenario: Error shape tolerance (failure)
    Tool: Bash
    Steps:
      1. Simulate error without status/message; ensure onError does not throw.
      2. Run: npm run test -t "SWR" > .sisyphus/evidence/task-8-swr-shape.txt
    Expected Result: No thrown errors.
    Evidence: .sisyphus/evidence/task-8-swr-shape.txt
  ```

- [x] 9. Refactor Admin Vectors page to SWR query hook (remove effect-fetch)

  **What to do**:
  - Replace `useEffect(() => fetchPosts(), [fetchPosts])` with a `useSWR`-based hook.
  - Preserve current behavior (uses `api.posts.getList(page, pageSize)`), unless there is strong evidence it must be admin endpoint.
  - Keep embedding actions as-is (imperative handlers), but ensure list state is SWR-driven.

  **Must NOT do**:
  - Do not change embedding APIs or UI layout.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 11,12
  - **Blocked By**: 2

  **References**:
  - `src/app/admin/vectors/page.tsx` - effect-fetch pattern.
  - `src/features/posts/hooks/useAdminPosts.ts` - SWR keying + `keepPreviousData` pattern.

  **Acceptance Criteria**:
  - [x] No `fetchPosts()` call inside a mount effect remains.
  - [x] Loading/error UI still works.
  - [x] `npm run build` and `npm run lint` pass.

  **QA Scenarios**:

  ```
  Scenario: Vectors list loads (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run build > .sisyphus/evidence/task-9-build.txt
      2. Run: npm run lint > .sisyphus/evidence/task-9-lint.txt
    Expected Result: No SWR/import errors; commands exit 0.
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: Remove effect-fetch (failure)
    Tool: Bash
    Steps:
      1. Add/keep a unit test or static check ensuring `useEffect` is not used for initial fetch in this page.
      2. Run: npm run test -t "Vectors" > .sisyphus/evidence/task-9-vectors.txt
    Expected Result: Test asserts SWR usage / no effect-fetch.
    Evidence: .sisyphus/evidence/task-9-vectors.txt
  ```

- [x] 10. Harden ClientMarkdownRenderer against races + add sanitization regression

  **What to do**:
  - Prevent stale async results overwriting newer `content` (race safety): in `useEffect`, ignore late results when content changes rapidly.
  - Ensure sanitization remains active (keep `rehype-sanitize` in `mdx-options`).
  - Add regression test for XSS-like inputs.

  **Must NOT do**:
  - Do not remove markdown features unless required by security posture.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 11,12
  - **Blocked By**: 2

  **References**:
  - `src/components/ui/data-display/ClientMarkdownRenderer.tsx` - async compile + `dangerouslySetInnerHTML`.
  - `src/lib/actions/markdown.ts` - compilation action.
  - `src/components/ui/data-display/mdx-options.ts` - sanitize schema.

  **Acceptance Criteria**:
  - [x] Unit test asserts output excludes `<script`.
  - [x] Race safety: rapid content changes do not show older HTML.

  **QA Scenarios**:

  ```
  Scenario: XSS stripped (happy path)
    Tool: Bash
    Steps:
      1. Run: npm run test -t "markdown" > .sisyphus/evidence/task-10-markdown.txt
    Expected Result: Pass; output does not contain disallowed tags.
    Evidence: .sisyphus/evidence/task-10-markdown.txt

  Scenario: Race safety (failure)
    Tool: Bash
    Steps:
      1. Ensure there is a test that triggers two compile calls and asserts the last one wins.
      2. Run: npm run test -t "markdown" > .sisyphus/evidence/task-10-race.txt
    Expected Result: Pass; final HTML corresponds to latest content.
    Evidence: .sisyphus/evidence/task-10-race.txt
  ```

- [x] 11. Targeted console cleanup in touched hotspots

  **What to do**:
  - Remove or gate `console.log` in:
    - `src/features/auth/hooks/useAuth.tsx`
    - `src/hooks/useAuthGuard.ts`
    - `src/app/login/page.tsx`
  - Keep `console.error` where it materially helps troubleshooting.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: 12
  - **Blocked By**: 5,6,7,8,9,10

  **References**:
  - `src/hooks/useAuthGuard.ts` - currently logs on redirect.
  - `src/app/login/page.tsx` - logs on success/error.

  **Acceptance Criteria**:
  - [x] `npm run build` passes.
  - [x] No new console noise added.

  **QA Scenarios**:

  ```
  Scenario: Build still passes (happy path)
    Tool: Bash
    Steps:
      1. npm run build > .sisyphus/evidence/task-11-build.txt
    Expected Result: Exit 0.
    Evidence: .sisyphus/evidence/task-11-build.txt

  Scenario: No unintended removal (failure)
    Tool: Bash
    Steps:
      1. Run: npm run lint > .sisyphus/evidence/task-11-lint.txt
    Expected Result: Exit 0.
    Evidence: .sisyphus/evidence/task-11-lint.txt
  ```

- [x] 12. Final verification + boundary correctness sweep

  **What to do**:
  - Run all verification commands.
  - Ensure no client component imports server-only modules and no server action is incorrectly used.
  - Ensure admin flows still gate correctly (auth guard + SWR redirect policy).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: FINAL
  - **Blocked By**: 11

  **References**:
  - `src/app/(blog)/page.tsx` - server component fetch + revalidate.
  - `src/components/pages/home/index.tsx` - client page using SWR infinite.
  - `src/shared/lib/swr.ts` - global SWR behavior.

  **Acceptance Criteria**:
  - [x] `npm run format:check` passes.
  - [x] `npm run lint` passes.
  - [x] `npm run test` passes.
  - [x] `npm run build` passes.

  **QA Scenarios**:

  ```
  Scenario: Full gate suite (happy path)
    Tool: Bash
    Steps:
      1. npm run format:check > .sisyphus/evidence/task-12-format.txt
      2. npm run lint > .sisyphus/evidence/task-12-lint.txt
      3. npm run test > .sisyphus/evidence/task-12-test.txt
      4. npm run build > .sisyphus/evidence/task-12-build.txt
    Expected Result: All exit 0.
    Evidence: .sisyphus/evidence/task-12-*.txt

  Scenario: Admin-only redirect policy honored (failure)
    Tool: Bash
    Steps:
      1. Run focused SWR redirect tests: npm run test -t "SWR" > .sisyphus/evidence/task-12-swr.txt
    Expected Result: Admin-only redirect test passes.
    Evidence: .sisyphus/evidence/task-12-swr.txt
  ```

---

## Final Verification Wave (MANDATORY)

- F1. Plan Compliance Audit — `oracle`
  - Verify each task's acceptance criteria and evidence files exist under `.sisyphus/evidence/`.
- F2. Code Quality Review — `unspecified-high`
  - Run `npm run build`, `npm run lint`, `npm run format:check`, `npm run test`.
- F3. Functional QA (Agent-executed) — `unspecified-high`
  - Run key flows: admin login redirect guard, admin logout, vectors page load, preview markdown render.
- F4. Scope Fidelity Check — `deep`
  - Ensure no auth architecture redesign, no sweeping style changes, only touched hotspots.

---

## Success Criteria

### Verification Commands

```bash
npm run format:check
npm run lint
npm run test
npm run build
```

### Final Checklist

- [x] Minimal tests introduced and stable (3–8 tests)
- [x] Unstable Input ID fixed
- [x] Logout clears token via centralized Auth flow
- [x] AuthProvider init runs checkAuthStatus (no debug skip)
- [x] SWR 401 redirect scoped to admin contexts
- [x] Admin vectors no longer effect-fetches initial list
- [x] Markdown renderer has XSS regression test + race-safety
