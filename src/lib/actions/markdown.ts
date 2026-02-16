'use server';

import { compileMDX } from 'next-mdx-remote/rsc';
import { sharedMdxOptions } from '@/components/ui/data-display/mdx-options';
import { sharedMdxComponents } from '@/components/ui/data-display/mdx-components';
import { normalizeMarkdownSource } from '@/lib/utils/markdown';

export async function compileMarkdownAction(source: string): Promise<string> {
  const normalizedSource = normalizeMarkdownSource(source);

  const { content } = await compileMDX({
    source: normalizedSource,
    options: { mdxOptions: sharedMdxOptions },
    components: sharedMdxComponents,
  });

  // 동적 import로 Turbopack 정적 분석 우회
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(content);
}
