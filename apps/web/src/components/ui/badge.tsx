import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline' | 'cyber';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
      default: 'bg-secondary text-secondary-foreground border border-border/50',
      primary: 'bg-primary/15 text-primary border border-primary/30 font-semibold',
      cyber: 'bg-primary/10 text-primary border border-primary/40 font-mono tracking-wider text-[10px]',
      success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      destructive: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
      outline: 'border border-border bg-card/40 text-foreground',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
