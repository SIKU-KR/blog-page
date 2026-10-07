# Dependency security maintenance

The OpenClaw agent reviews dependencies **every Monday at 10:00 Asia/Seoul**.
The user delegated review, fixes, validation, PR creation, and merge to the agent.
The schedule is owned by OpenClaw, not GitHub Actions.

GitHub's Claude/security-fix and Dependabot auto-merge workflows are removed.
Dependabot detection and security-update PRs remain enabled. Only the normal CI
workflow remains in this repository; no GitHub job automatically changes or
merges dependencies. The agent uses the connected managed GitHub identity.

Each weekly review:

1. Inspect current repository state, Dependabot alerts/PRs, `npm audit` including
   production-only results, and available patches for tracked advisories.
2. Review upstream release notes and migration requirements. Apply compatible
   fixes first; handle necessary major upgrades with code/CSS changes and proper
   verification. Never run `npm audit fix --force` blindly.
3. Validate audit JSON; registry failures are not clean audit results. Do not
   suppress advisories or weaken tests/lint just to pass.
4. Run formatting, lint, application/automation tests, coverage, and a production
   build with `.github/ci.env` placeholders. Push a focused branch and PR using
   the connected GitHub identity, preserving unrelated work.
5. Wait for CI and deployment preview to pass, then merge the exact reviewed head
   commit. Confirm master CI and production deployment/health. No standing
   Dependabot auto-merge is enabled outside the agent's review.
6. Update the single unresolved-advisory tracking issue
   [#56](https://github.com/SIKU-KR/blog-page/issues/56) without repetitive comments;
   close it only when the full audit is clean. Report changes or blockers to the
   user's conversation; stay quiet when there is nothing new.

The existing master ruleset requires GitHub Actions `checks`; retain that gate.
The weekly task's timing, checklist, and latest outcome are held in its OpenClaw
automation scratch, without a separate task-state file in the repository.

## 2026-10-07 remediation

The initial full audit found 14 vulnerable package entries. Compatible updates
patched Axios (1.19.0 → 1.20.0), Sharp (0.35.4 → 0.35.5), source-map-js
(1.2.1 → 1.2.2), and brace-expansion. The `postcss-selector-parser` override uses
7.1.6 to patch GHSA-rj75-hqrm-r3gf, including copies pulled in by Tailwind 3 and
its typography/nesting plugins. The 7.0 change makes insertion during iteration
safe; the application does not use this parser directly. A CSS-generation
regression test verifies typography, responsive utilities, and selector variants.

The production-only audit is clean. Seven high-severity package entries remain
in the development tool chain, all caused by **one** advisory:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
`braces` 3.0.3 is the latest published version and the advisory has no patched
version. Its dependants include chokidar, micromatch, fast-glob, Tailwind 3, and
the Next ESLint plugin/config. Upgrading Tailwind alone would not remove the
ESLint dependency chain. Downgrading Next lint tooling or aliasing `braces` to
an incompatible package is not a valid security fix.

These packages process repository-controlled paths/styles during development
and builds; the production-only npm graph does not include them. Do not pass
untrusted glob patterns to these tools. This is a remaining advisory, **not** an
audit exemption or a claim that the full audit is clean. Recheck upstream fixes
on each maintenance run; any migration needs application and CSS verification.

Local commands:

```sh
npm audit
npm audit --omit=dev
node --test .github/scripts/*.test.mjs
npm run format:check
npm run lint
npm test
npm run test:coverage
set -a
. .github/ci.env
set +a
npm run build
```
