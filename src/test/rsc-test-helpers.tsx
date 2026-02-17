import { render } from '@testing-library/react';

interface StructuralOptions {
  ignoreAttributes?: string[];
  normalizeWhitespace?: boolean;
}

const normalizeNode = (node: Node, options: StructuralOptions): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    return options.normalizeWhitespace ? text.trim().replace(/\s+/g, ' ') : text;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();

    const attrs = Array.from(el.attributes)
      .filter(attr => !options.ignoreAttributes?.includes(attr.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(' ');

    const children = Array.from(el.childNodes)
      .map(child => normalizeNode(child, options))
      .filter(Boolean)
      .join('');

    return `<${tagName}${attrs ? ' ' + attrs : ''}>${children}</${tagName}>`;
  }

  return '';
};

export const getComponentStructure = (
  ui: React.ReactElement,
  options: StructuralOptions = { ignoreAttributes: ['id'], normalizeWhitespace: true }
) => {
  const { container } = render(ui);
  return Array.from(container.childNodes)
    .map(node => normalizeNode(node, options))
    .join('');
};

export const expectStructuralMatch = (
  ui: React.ReactElement,
  expectedStructure: string,
  options?: StructuralOptions
) => {
  const actualStructure = getComponentStructure(ui, options);
  if (actualStructure !== expectedStructure) {
    throw new Error(
      `Structural mismatch!\nExpected: ${expectedStructure}\nActual: ${actualStructure}`
    );
  }
};
