import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Badge component variants using CVA
 * Provides consistent, type-safe styling for status labels and tags
 */
export const badgeVariants = cva(
  // Base styles
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-gray-200 text-gray-900',
        danger: 'bg-red-100 text-red-800',
        success: 'bg-green-100 text-green-800',
        outline: 'border border-gray-300 text-gray-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
