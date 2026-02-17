import { describe, expect, it } from 'vitest';

import { compileMarkdownAction } from '@/lib/actions/markdown';

describe('markdown sanitization characterization', () => {
  it('does not include script tags from untrusted markdown', async () => {
    const compiledHtml = await compileMarkdownAction('safe text<script>alert("xss")</script>');

    expect(compiledHtml).not.toContain('<script');
    expect(compiledHtml).not.toContain('alert("xss")');
  });

  it('strips inline event handlers from raw html content', async () => {
    const compiledHtml = await compileMarkdownAction('<img src="x" onerror="alert(1)" />safe');

    expect(compiledHtml).not.toContain('onerror=');
    expect(compiledHtml).not.toContain('alert(1)');
  });
});
