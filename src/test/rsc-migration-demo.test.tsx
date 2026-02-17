import { describe, expect, it } from 'vitest';
import { expectStructuralMatch, getComponentStructure } from './rsc-test-helpers';

const SimpleComponent = ({ title, content }: { title: string; content: string }) => (
  <div className="container">
    <h1 id="title-123">{title}</h1>
    <p className="text-gray-500">{content}</p>
  </div>
);

describe('RSC Migration Helpers Demo', () => {
  it('captures and matches component structure while ignoring volatile attributes', () => {
    const ui = <SimpleComponent title="Hello" content="World" />;

    const structure = getComponentStructure(ui);

    expect(structure).toBe(
      '<div class="container"><h1>Hello</h1><p class="text-gray-500">World</p></div>'
    );

    expectStructuralMatch(
      ui,
      '<div class="container"><h1>Hello</h1><p class="text-gray-500">World</p></div>'
    );
  });

  it('fails when structure changes', () => {
    const ui = <SimpleComponent title="Hello" content="World" />;
    const differentStructure = '<div class="container"><h2>Hello</h2><p>World</p></div>';

    expect(() => expectStructuralMatch(ui, differentStructure)).toThrow('Structural mismatch!');
  });
});
