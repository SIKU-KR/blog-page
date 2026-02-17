import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ClientMarkdownRenderer from '@/components/ui/data-display/ClientMarkdownRenderer';

const compileMarkdownActionMock = vi.fn<(source: string) => Promise<string>>();

vi.mock('@/lib/actions/markdown', () => ({
  compileMarkdownAction: (source: string) => compileMarkdownActionMock(source),
}));

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(resolver => {
    resolve = resolver;
  });

  return { promise, resolve };
};

describe('ClientMarkdownRenderer characterization', () => {
  beforeEach(() => {
    compileMarkdownActionMock.mockReset();
  });

  it('keeps latest markdown result when previous compile resolves later', async () => {
    const firstCompile = createDeferred<string>();
    const secondCompile = createDeferred<string>();

    compileMarkdownActionMock
      .mockImplementationOnce(() => firstCompile.promise)
      .mockImplementationOnce(() => secondCompile.promise);

    const { rerender } = render(<ClientMarkdownRenderer content="first" />);
    rerender(<ClientMarkdownRenderer content="second" />);

    await act(async () => {
      secondCompile.resolve('<p>latest content</p>');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText('latest content')).toBeInTheDocument();
    });

    await act(async () => {
      firstCompile.resolve('<p>stale content</p>');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText('stale content')).not.toBeInTheDocument();
      expect(screen.getByText('latest content')).toBeInTheDocument();
    });
  });
});
