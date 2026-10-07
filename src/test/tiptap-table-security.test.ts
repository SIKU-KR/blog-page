import { generateHTML, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { describe, expect, it } from 'vitest';

const cellTypes = ['tableCell', 'tableHeader'] as const;
const extensions = [
  StarterKit,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

function renderCell(type: (typeof cellTypes)[number], align: string) {
  const content: JSONContent = {
    type: 'doc',
    content: [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type,
                attrs: { align, colspan: 2, rowspan: 2 },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Safe content' }] }],
              },
            ],
          },
        ],
      },
    ],
  };
  const container = document.createElement('div');
  container.innerHTML = generateHTML(content, extensions);
  return container.querySelector(type === 'tableCell' ? 'td' : 'th')!;
}

describe.each(cellTypes)('Tiptap %s content serialization', type => {
  it.each(['left', 'center', 'right'])('preserves normal %s alignment and spans', align => {
    const cell = renderCell(type, align);
    expect(cell.textContent).toBe('Safe content');
    expect(cell.style.textAlign).toBe(align);
    expect(cell.getAttribute('colspan')).toBe('2');
    expect(cell.getAttribute('rowspan')).toBe('2');
  });

  it.each(['left; position: fixed; inset: 0; z-index: 9999', 'left } body { display: none'])(
    'rejects alignment escaping a CSS declaration: %s',
    align => {
      const cell = renderCell(type, align);
      expect(cell.textContent).toBe('Safe content');
      expect(cell.getAttribute('style')).toBeNull();
      expect(cell.outerHTML).not.toContain('position');
      expect(cell.outerHTML).not.toContain('display');
    }
  );
});
