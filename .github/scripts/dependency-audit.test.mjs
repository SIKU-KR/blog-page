import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAudit } from './dependency-audit.mjs';

const counts = { total: 0, critical: 0, high: 0, moderate: 0, low: 0 };

test('registry failures and malformed audits cannot be reported as clean', () => {
  for (const report of [
    { error: { code: 'ENOTFOUND' } },
    {},
    { metadata: { vulnerabilities: counts } },
  ]) {
    assert.throws(() => renderAudit(report), /Invalid npm audit report/);
  }
});

test('a valid clean audit reports zero known vulnerabilities', () => {
  assert.match(
    renderAudit({ metadata: { vulnerabilities: counts }, vulnerabilities: {} }),
    /\*\*0\*\*/
  );
});

test('advisories are deduplicated across transitive dependency chains', () => {
  const advisory = {
    name: 'braces',
    severity: 'high',
    url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
    range: '<=3.0.3',
  };
  const markdown = renderAudit({
    metadata: { vulnerabilities: { ...counts, total: 2, high: 2 } },
    vulnerabilities: { braces: { via: [advisory] }, micromatch: { via: ['braces', advisory] } },
  });
  assert.equal(markdown.split('| braces |').length - 1, 1);
  assert.match(markdown, /Remaining advisories/);
});
