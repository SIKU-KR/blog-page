import React, { forwardRef, useId } from 'react';
import { inputVariants, type InputVariants } from '@/shared/ui/variants';
import { cn } from '@/shared/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, InputVariants {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, variant, inputSize, ...props }, ref) => {
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const variantToUse = error ? 'error' : variant;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(inputVariants({ variant: variantToUse, inputSize }), className)}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
