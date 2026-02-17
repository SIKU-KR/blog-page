import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDraftManagement } from '@/hooks/useDraftManagement';
import { draftStorage, type DraftSnapshot } from '@/lib/utils/draft-storage';
import { logger } from '@/lib/utils/logger';

const createSnapshot = (overrides: Partial<DraftSnapshot> = {}): DraftSnapshot => ({
  title: '초기 제목',
  content: '초기 내용',
  summary: '',
  slug: 'initial-slug',
  scheduledAt: null,
  ...overrides,
});

describe('useDraftManagement lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-17T00:00:00.000Z'));

    vi.spyOn(draftStorage, 'getDrafts').mockReturnValue([]);
    vi.spyOn(draftStorage, 'addDraft').mockImplementation(() => undefined);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  it('does not crash when autosave interval registration fails', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    vi.spyOn(window, 'setInterval').mockImplementation(() => {
      throw new Error('setInterval registration failed');
    });

    let unmount: (() => void) | undefined;

    expect(() => {
      const hook = renderHook(() => useDraftManagement(createSnapshot()));
      unmount = hook.unmount;
    }).not.toThrow();

    if (unmount) {
      unmount();
    }

    expect(clearIntervalSpy).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('자동 임시저장 인터벌 설정 오류', expect.any(Error));
  });

  it('cleans up autosave interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const intervalId = 777 as unknown as ReturnType<typeof window.setInterval>;

    vi.spyOn(window, 'setInterval').mockImplementation(() => intervalId);

    const { unmount } = renderHook(() => useDraftManagement(createSnapshot()));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
  });
});
