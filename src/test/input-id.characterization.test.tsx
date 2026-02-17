import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '@/components/ui/Input';

describe('Input id characterization', () => {
  it('keeps label association stable across rerenders when id is provided', () => {
    const { rerender } = render(<Input id="email-input" label="Email" />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email-input');
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-input');

    rerender(<Input id="email-input" label="Email" />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email-input');
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-input');
  });

  it('keeps generated id stable across rerenders when id is omitted', () => {
    const { rerender } = render(<Input label="Email" />);

    const initialInputId = screen.getByLabelText('Email').getAttribute('id');

    expect(initialInputId).toBeTruthy();
    expect(screen.getByText('Email')).toHaveAttribute('for', initialInputId);

    rerender(<Input label="Email" />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', initialInputId);
    expect(screen.getByText('Email')).toHaveAttribute('for', initialInputId);
  });
});
