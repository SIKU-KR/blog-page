// Decides whether an automated dependency PR (Dependabot or the weekly Claude fix) may be
// auto-merged, then enables or disables GitHub auto-merge accordingly.
//
// Auto-merge only when:
//   - the PR changes nothing but package.json / package-lock.json, and
//   - no direct dependency or override moves to a new major version
//     (0.x minor bumps count as major).
// Otherwise auto-merge is turned off and the reasons are left as a PR comment.
// The actual merge still waits for the required status checks (CI) to pass.
//
// Usage: node .github/scripts/dependency-automerge.mjs <pr-url> <base-ref> <head-ref>
import { execFileSync } from 'node:child_process';

const DEPENDENCY_FILES = new Set(['package.json', 'package-lock.json']);
const COMMENT_MARKER = '<!-- dependency-automerge -->';

const [prUrl, baseRef, headRef] = process.argv.slice(2);
if (!prUrl || !baseRef || !headRef) {
  console.error('Usage: dependency-automerge.mjs <pr-url> <base-ref> <head-ref>');
  process.exit(2);
}

const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const readJson = (ref, file) => JSON.parse(run('git', ['show', `${ref}:${file}`]));

const majorOf = version => {
  const match = /^(\d+)\.(\d+)/.exec(version ?? '');
  if (!match) return null;
  return match[1] === '0' ? `0.${match[2]}` : match[1];
};

// Override keys may carry a version selector ("foo@^1", "@scope/foo@2").
const packageName = spec => spec.replace(/(.)@.*$/, '$1');

const findRisks = () => {
  const risks = [];

  const changedFiles = run('git', ['diff', '--name-only', `${baseRef}...${headRef}`])
    .split('\n')
    .filter(Boolean);
  const otherFiles = changedFiles.filter(file => !DEPENDENCY_FILES.has(file));
  if (otherFiles.length > 0) {
    risks.push(`의존성 파일 외 변경: ${otherFiles.join(', ')}`);
  }

  const pkg = readJson(headRef, 'package.json');
  const names = new Set(
    [pkg.dependencies, pkg.devDependencies, pkg.overrides]
      .flatMap(section => Object.keys(section ?? {}))
      .map(packageName)
  );
  const before = readJson(baseRef, 'package-lock.json').packages ?? {};
  const after = readJson(headRef, 'package-lock.json').packages ?? {};
  for (const name of names) {
    const from = before[`node_modules/${name}`]?.version;
    const to = after[`node_modules/${name}`]?.version;
    if (from && to && majorOf(from) !== majorOf(to)) {
      risks.push(`메이저 업그레이드: ${name} ${from} → ${to}`);
    }
  }

  return risks;
};

const upsertComment = (comments, body) => {
  const existing = comments.find(comment => comment.body.includes(COMMENT_MARKER));
  const commentId = existing?.url.split('#issuecomment-')[1];
  if (commentId) {
    run('gh', [
      'api',
      '--method',
      'PATCH',
      `repos/{owner}/{repo}/issues/comments/${commentId}`,
      '-f',
      `body=${body}`,
    ]);
  } else {
    run('gh', ['pr', 'comment', prUrl, '--body', body]);
  }
};

const risks = findRisks();
const pr = JSON.parse(run('gh', ['pr', 'view', prUrl, '--json', 'autoMergeRequest,comments']));

if (risks.length === 0) {
  if (!pr.autoMergeRequest) {
    run('gh', ['pr', 'merge', prUrl, '--auto', '--merge']);
  }
  console.log(`Auto-merge enabled: ${prUrl}`);
} else {
  if (pr.autoMergeRequest) {
    run('gh', ['pr', 'merge', prUrl, '--disable-auto']);
  }
  const body = [
    COMMENT_MARKER,
    '**자동 머지 보류** — 아래 이유로 직접 리뷰 후 머지가 필요합니다.',
    '',
    ...risks.map(risk => `- ${risk}`),
  ].join('\n');
  upsertComment(pr.comments, body);
  console.log(`Auto-merge withheld: ${prUrl}\n${risks.join('\n')}`);
}
