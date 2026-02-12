import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypePrettyCode from 'rehype-pretty-code';
import type { CompileMDXResult } from 'next-mdx-remote/rsc';

const customSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), 'style', 'data-line'],
    code: [...(defaultSchema.attributes?.code || []), 'data-language', 'data-theme'],
    pre: [...(defaultSchema.attributes?.pre || []), 'data-language', 'data-theme'],
    figure: [...(defaultSchema.attributes?.figure || []), 'data-rehype-pretty-code-figure'],
  },
  tagNames: [...(defaultSchema.tagNames || []), 'figure'],
};

export const sharedMdxOptions = {
  format: 'md' as const,
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeRaw,
    [rehypePrettyCode, { theme: 'github-light' }],
    [rehypeSanitize, customSanitizeSchema],
  ],
} satisfies NonNullable<Parameters<typeof import('next-mdx-remote/rsc').compileMDX>[0]['options']>['mdxOptions'];
