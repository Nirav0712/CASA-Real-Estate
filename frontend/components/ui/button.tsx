import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'start',
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-casa-brand text-white hover:bg-casa-brand-hover focus:ring-casa-brand shadow-sm dark:focus:ring-offset-gray-900',
      secondary:
        'bg-casa-subtle text-casa-text-primary hover:bg-casa-muted focus:ring-casa-border-medium dark:focus:ring-offset-gray-900',
      outline:
        'border border-casa-border-medium bg-transparent text-casa-text-primary hover:bg-casa-subtle focus:ring-casa-brand dark:focus:ring-offset-gray-900',
      ghost:
        'bg-transparent text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle dark:hover:bg-gray-800',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm dark:focus:ring-offset-gray-900',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm dark:focus:ring-offset-gray-900',
      accent:
        'bg-casa-brand-accent text-white hover:bg-indigo-600 focus:ring-casa-brand-accent shadow-sm',
    };

    const sizes = {
      xs: 'text-xs px-2.5 py-1 gap-1',
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
        {!loading && icon && iconPosition === 'start' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'end' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
