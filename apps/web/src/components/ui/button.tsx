import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'cyber' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]';

    const variants: Record<string, string> = {
      default:
        'bg-primary text-primary-foreground font-semibold shadow-sm hover:brightness-110 active:brightness-95 hover:shadow-primary/25 hover:shadow-md',
      cyber:
        'bg-primary/10 text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:border-primary',
      glass:
        'glass-card text-foreground hover:bg-secondary/80 hover:border-primary/40',
      outline:
        'border border-border bg-card/50 hover:bg-secondary hover:border-primary/40 text-foreground',
      ghost:
        'hover:bg-secondary text-foreground hover:text-primary',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2 text-sm rounded-lg',
      sm: 'h-8 px-3 text-xs rounded-md',
      xs: 'h-7 px-2.5 text-xs rounded-md',
      lg: 'h-11 px-6 text-base rounded-xl',
      icon: 'h-9 w-9 rounded-lg',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
