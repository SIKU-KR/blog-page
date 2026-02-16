import { compileMDX } from 'next-mdx-remote/rsc';
import { proseClasses } from './prose-classes';
import { sharedMdxOptions } from './mdx-options';
import { sharedMdxComponents } from './mdx-components';
import { normalizeMarkdownSource } from '@/lib/utils/markdown';

interface ServerMarkdownRendererProps {
  content: string;
  className?: string;
}

export default async function ServerMarkdownRenderer({
  content,
  className = '',
}: ServerMarkdownRendererProps) {
  const normalizedContent = normalizeMarkdownSource(content);

  const { content: mdxContent } = await compileMDX({
    source: normalizedContent,
    options: { mdxOptions: sharedMdxOptions },
    components: sharedMdxComponents,
  });

  return <div className={`${proseClasses} ${className}`.trim()}>{mdxContent}</div>;
}
