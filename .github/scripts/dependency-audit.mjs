import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function renderAudit(report) {
  if (
    report.error ||
    !report.metadata?.vulnerabilities ||
    !report.vulnerabilities ||
    !Number.isInteger(report.metadata.vulnerabilities.total)
  ) {
    throw new Error('Invalid npm audit report; a failed audit is not a clean result.');
  }
  const counts = report.metadata.vulnerabilities;
  const lines = [
    `Known vulnerabilities: **${counts.total}** (critical: ${counts.critical}, high: ${counts.high}, moderate: ${counts.moderate}, low: ${counts.low}).`,
    '',
  ];
  const advisories = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities)) {
    for (const advisory of vulnerability.via ?? []) {
      if (typeof advisory === 'object') advisories.set(advisory.url, advisory);
    }
  }
  if (advisories.size) {
    lines.push(
      '| Package | Severity | Advisory | Affected versions |',
      '| --- | --- | --- | --- |'
    );
    for (const advisory of advisories.values()) {
      const escape = value =>
        String(value ?? '')
          .replaceAll('|', '\\|')
          .replaceAll('\n', ' ');
      const id = advisory.url.split('/').at(-1);
      lines.push(
        `| ${escape(advisory.name)} | ${escape(advisory.severity)} | [${id}](${advisory.url}) | ${escape(advisory.range)} |`
      );
    }
    lines.push(
      '',
      'Remaining advisories need upstream patches or a reviewed migration. This workflow never uses npm audit fix --force.',
      ''
    );
  }
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  console.log(renderAudit(report));
}
