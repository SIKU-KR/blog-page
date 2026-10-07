# Dependency security maintenance

The weekly `Dependency security fix` workflow runs on Monday at 10:00 KST and can
also be started manually. It no longer requires Claude, an AI subscription, or a
long-lived GitHub token.

- Run `npm audit fix` without `--force`; never automatically migrate major versions.
- Validate audit JSON so registry errors cannot be mistaken for a clean result.
- Keep before/after and production-only audit reports in the run summary/artifact.
- Maintain one tracking issue for remaining advisories; update it without repeated
  comments, and close it when the complete audit is clean.
- Verify formatting, lint, tests, automation tests, coverage, and the build before
  opening a PR with the maintained `peter-evans/create-pull-request` action.
- Explicitly dispatch CI for the PR branch: `GITHUB_TOKEN` pushes do not start CI.
- Preserve the existing dependency-only/major-version auto-merge risk policy.
- The master ruleset must require the GitHub Actions `checks` status. Repository
  Actions settings must allow GitHub Actions to create pull requests.

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
