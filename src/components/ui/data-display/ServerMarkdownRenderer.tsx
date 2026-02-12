import { compileMDX } from 'next-mdx-remote/rsc';
import { proseClasses } from './prose-classes';
import { sharedMdxOptions } from './mdx-options';
import { sharedMdxComponents } from './mdx-components';

interface ServerMarkdownRendererProps {
  content: string;
  className?: string;
}

export default async function ServerMarkdownRenderer({
  content,
  className = '',
}: ServerMarkdownRendererProps) {
  const { content: mdxContent } = await compileMDX({
    source: content,
    options: { mdxOptions: sharedMdxOptions },
    components: sharedMdxComponents,
  });

  return (
    <div className={`${proseClasses} ${className}`.trim()}>
      {mdxContent}
    </div>
  );
}
