import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ShareButton from '@/features/posts/components/ShareButton';

describe('ShareButton URL behavior', () => {
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn<(_: string) => Promise<void>>();

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });
    writeText.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
  });

  it('copies canonical URL normalized to site origin', async () => {
    writeText.mockResolvedValueOnce();

    render(<ShareButton canonicalUrl="/posts/hello?x=1#k" />);
    fireEvent.click(screen.getByRole('button', { name: '링크 공유하기' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://www.bumsiku.kr/posts/hello?x=1#k');
    });
  });

  it('falls back to current window URL when canonical URL is absent', async () => {
    writeText.mockResolvedValueOnce();
    window.history.pushState({}, '', '/from-window?tab=all#section');

    render(<ShareButton />);
    fireEvent.click(screen.getByRole('button', { name: '링크 공유하기' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://www.bumsiku.kr/from-window?tab=all#section');
    });
  });
});
