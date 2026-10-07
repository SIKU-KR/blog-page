import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import typography from '@tailwindcss/typography';
import { describe, expect, it } from 'vitest';

describe('patched PostCSS selector parser compatibility', () => {
  it('preserves typography, responsive utilities, and arbitrary selector variants', async () => {
    const result = await postcss([
      tailwindcss({
        content: [
          {
            raw: '<article class="prose prose-slate md:prose-lg [&>p]:text-red-500"></article>',
          },
        ],
        plugins: [typography],
      }),
    ]).process('@tailwind components; @tailwind utilities;', { from: undefined });

    expect(result.css).toContain('.prose');
    expect(result.css).toContain(':where(pre)');
    expect(result.css).toContain('@media (min-width: 768px)');
    expect(result.css).toContain('>p');
    expect(result.css).toContain('--tw-text-opacity');
  });
});
