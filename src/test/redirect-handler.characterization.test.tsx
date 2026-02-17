import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RedirectHandler from '@/components/RedirectHandler';

const replaceMock = vi.fn();
let pathnameMock = '/';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock,
}));

describe('RedirectHandler', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    pathnameMock = '/';
  });

  it('redirects when current path differs from redirectPath', () => {
    pathnameMock = '/admin';

    render(<RedirectHandler redirectPath="/admin/posts" />);

    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/admin/posts');
  });

  it('does not redirect when current path matches redirectPath', () => {
    pathnameMock = '/admin/posts';

    render(<RedirectHandler redirectPath="/admin/posts" />);

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('does not emit debug logging while handling redirects', () => {
    pathnameMock = '/admin';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<RedirectHandler redirectPath="/admin/posts" />);

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
