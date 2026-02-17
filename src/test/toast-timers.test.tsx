import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from '@/components/ui/Toast';

const ToastTrigger = () => {
  const { addToast } = useToast();

  return (
    <button onClick={() => addToast('toast message', 'info')} type="button">
      add toast
    </button>
  );
};

describe('Toast timer cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears pending timers when the provider unmounts', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'add toast' }));
    fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

    const timerIds = setTimeoutSpy.mock.results
      .filter((_, index) => setTimeoutSpy.mock.calls[index]?.[1] === 5000)
      .map(result => result.value);

    expect(timerIds).toHaveLength(2);

    unmount();

    timerIds.forEach(timerId => {
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
    });
  });

  it('clears pending timer when toast is manually dismissed', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'add toast' }));

    const timerResult = setTimeoutSpy.mock.results.find(
      (_, index) => setTimeoutSpy.mock.calls[index]?.[1] === 5000
    );

    expect(timerResult).toBeDefined();

    fireEvent.click(screen.getByLabelText('Close toast'));

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerResult?.value);
  });
});
