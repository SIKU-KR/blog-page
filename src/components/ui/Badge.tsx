import React, { forwardRef } from 'react';
import { badgeVariants, type BadgeVariants } from '@/shared/ui/variants';
import { cn } from '@/shared/lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, BadgeVariants {
  children: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
