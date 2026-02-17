import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SRC_ROOT = path.join(REPO_ROOT, 'src');

const MIGRATED_SERVER_SAFE_FILES = [
  'src/app/admin/posts/edit/layout.tsx',
  'src/app/admin/posts/write/layout.tsx',
  'src/components/admin/AdminTable.tsx',
  'src/components/ui/Badge.tsx',
  'src/components/ui/Button.tsx',
  'src/features/posts/components/PostItem.tsx',
  'src/components/pages/home/HomePageShell.tsx',
  'src/components/ui/PaginationShell.tsx',
  'src/components/layout/AdminHeaderShell.tsx',
  'src/components/admin/AdminSidebarShell.tsx',
  'src/components/layout/NavigationShell.tsx',
] as const;

const MIGRATED_CLIENT_WRAPPERS = [
  'src/components/pages/home/index.tsx',
  'src/components/ui/Pagination.tsx',
  'src/components/layout/AdminHeader.tsx',
  'src/components/admin/AdminSidebar.tsx',
  'src/components/layout/Navigation.tsx',
] as const;

const CLIENT_ONLY_MODULE_PATTERNS = [
  /^next\/navigation$/,
  /^next\/router$/,
  /^react-dom\/client$/,
  /^client-only$/,
];

const CLIENT_ONLY_IDENTIFIER_PATTERN =
  /\b(window|document|localStorage|sessionStorage|navigator)\b/;

const CLIENT_HOOK_CALL_PATTERN =
  /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useReducer|useRef|useMemo|useCallback|useImperativeHandle|useTransition|useDeferredValue|useOptimistic|useActionState)\s*\(/;

const IMPORT_FROM_PATTERN = /\bfrom\s+['"]([^'"]+)['"]/g;
const IMPORT_SIDE_EFFECT_PATTERN = /\bimport\s+['"]([^'"]+)['"]/g;

const sourceCache = new Map<string, string>();

type Violation = {
  entry: string;
  kind: string;
  module: string;
  detail: string;
  chain: string[];
};

const toAbsolutePath = (filePath: string) => path.join(REPO_ROOT, filePath);
const toRelativePath = (filePath: string) => path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');

const readSource = (absolutePath: string) => {
  const cached = sourceCache.get(absolutePath);
  if (cached != null) {
    return cached;
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  sourceCache.set(absolutePath, source);

  return source;
};

const hasUseClientDirective = (source: string) => {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  let inBlockComment = false;

  for (const rawLine of lines) {
    let line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (inBlockComment) {
      const endIndex = line.indexOf('*/');
      if (endIndex === -1) {
        continue;
      }

      inBlockComment = false;
      line = line.slice(endIndex + 2).trim();
      if (!line) {
        continue;
      }
    }

    if (line.startsWith('//')) {
      continue;
    }

    if (line.startsWith('/*')) {
      const endIndex = line.indexOf('*/');
      if (endIndex === -1) {
        inBlockComment = true;
        continue;
      }

      line = line.slice(endIndex + 2).trim();
      if (!line) {
        continue;
      }
    }

    return /^['"]use client['"];?$/.test(line);
  }

  return false;
};

const extractImportSpecifiers = (source: string) => {
  const specifiers = new Set<string>();

  for (const pattern of [IMPORT_FROM_PATTERN, IMPORT_SIDE_EFFECT_PATTERN]) {
    pattern.lastIndex = 0;
    let match = pattern.exec(source);

    while (match != null) {
      const specifier = match[1];
      if (specifier != null) {
        specifiers.add(specifier);
      }

      match = pattern.exec(source);
    }
  }

  return [...specifiers];
};

const resolveInternalImport = (fromAbsolutePath: string, specifier: string) => {
  let unresolvedPath: string | null = null;

  if (specifier.startsWith('@/')) {
    unresolvedPath = path.join(SRC_ROOT, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    unresolvedPath = path.resolve(path.dirname(fromAbsolutePath), specifier);
  }

  if (unresolvedPath == null) {
    return null;
  }

  const tryPaths = [
    unresolvedPath,
    `${unresolvedPath}.ts`,
    `${unresolvedPath}.tsx`,
    `${unresolvedPath}.js`,
    `${unresolvedPath}.jsx`,
    path.join(unresolvedPath, 'index.ts'),
    path.join(unresolvedPath, 'index.tsx'),
    path.join(unresolvedPath, 'index.js'),
    path.join(unresolvedPath, 'index.jsx'),
  ];

  for (const candidatePath of tryPaths) {
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      return candidatePath;
    }
  }

  return null;
};

const collectViolations = (entryRelativePath: string) => {
  const entryAbsolutePath = toAbsolutePath(entryRelativePath);
  const violations: Violation[] = [];
  const visited = new Set<string>();

  const walk = (moduleAbsolutePath: string, chain: string[]) => {
    if (visited.has(moduleAbsolutePath)) {
      return;
    }

    visited.add(moduleAbsolutePath);
    const source = readSource(moduleAbsolutePath);
    const moduleRelativePath = toRelativePath(moduleAbsolutePath);
    const isClientBoundary = hasUseClientDirective(source);

    if (!isClientBoundary) {
      if (CLIENT_ONLY_IDENTIFIER_PATTERN.test(source)) {
        violations.push({
          entry: entryRelativePath,
          kind: 'client-browser-api-usage',
          module: moduleRelativePath,
          detail: 'contains window/document/localStorage/sessionStorage/navigator reference',
          chain,
        });
      }

      if (CLIENT_HOOK_CALL_PATTERN.test(source)) {
        violations.push({
          entry: entryRelativePath,
          kind: 'client-react-hook-usage',
          module: moduleRelativePath,
          detail: 'contains client hook call (useState/useEffect/etc.)',
          chain,
        });
      }
    }

    const importSpecifiers = extractImportSpecifiers(source);

    for (const specifier of importSpecifiers) {
      if (CLIENT_ONLY_MODULE_PATTERNS.some(pattern => pattern.test(specifier))) {
        violations.push({
          entry: entryRelativePath,
          kind: 'client-only-module-import',
          module: moduleRelativePath,
          detail: `imports client-only module "${specifier}"`,
          chain,
        });
      }

      const importedAbsolutePath = resolveInternalImport(moduleAbsolutePath, specifier);
      if (importedAbsolutePath == null) {
        continue;
      }

      const importedSource = readSource(importedAbsolutePath);
      const importedRelativePath = toRelativePath(importedAbsolutePath);
      const importedIsClientBoundary = hasUseClientDirective(importedSource);

      if (moduleAbsolutePath === entryAbsolutePath && importedIsClientBoundary) {
        violations.push({
          entry: entryRelativePath,
          kind: 'direct-client-boundary-import',
          module: moduleRelativePath,
          detail: `directly imports client boundary ${importedRelativePath}`,
          chain: [...chain, importedRelativePath],
        });
        continue;
      }

      if (importedIsClientBoundary) {
        continue;
      }

      walk(importedAbsolutePath, [...chain, importedRelativePath]);
    }
  };

  walk(entryAbsolutePath, [entryRelativePath]);

  return violations;
};

describe('RSC migration boundary audit', () => {
  it('keeps migrated client wrappers explicitly marked with use client', () => {
    for (const filePath of MIGRATED_CLIENT_WRAPPERS) {
      const source = readSource(toAbsolutePath(filePath));
      expect(hasUseClientDirective(source), `${filePath} must keep explicit client boundary`).toBe(
        true
      );
    }
  });

  it('keeps migrated server-safe files free of client-only leakage', () => {
    const violations = MIGRATED_SERVER_SAFE_FILES.flatMap(collectViolations);

    const formattedViolations = violations.map(violation => {
      return [
        `entry=${violation.entry}`,
        `kind=${violation.kind}`,
        `module=${violation.module}`,
        `detail=${violation.detail}`,
        `chain=${violation.chain.join(' -> ')}`,
      ].join(' | ');
    });

    expect(formattedViolations).toEqual([]);
  });
});
