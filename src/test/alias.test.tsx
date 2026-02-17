import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { cn } from '@/shared/lib/cn';

const AliasProbe = () => {
  return <div className={cn('px-2', 'px-4')}>alias works</div>;
};

describe('vitest alias setup', () => {
  it('resolves @/ imports and runs in jsdom', () => {
    render(<AliasProbe />);

    expect(screen.getByText('alias works')).toBeInTheDocument();
    expect(screen.getByText('alias works')).toHaveClass('px-4');
    expect(screen.getByText('alias works')).not.toHaveClass('px-2');
  });
});
