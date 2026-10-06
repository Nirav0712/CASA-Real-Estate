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
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
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

export function Card({
  className,
  hoverable = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      className={cn(
        'bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle transition-all duration-200 overflow-hidden',
        hoverable && 'hover:shadow-medium hover:border-casa-border-medium cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  icon,
  children,
}: {
  className?: string;
  variant?:
    | 'default'
    | 'pending'
    | 'active'
    | 'rejected'
    | 'draft'
    | 'featured'
    | 'verified'
    | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const variants = {
    default:
      'bg-casa-subtle text-casa-text-secondary border border-casa-border-light dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    pending:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 font-semibold',
    active:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    rejected:
      'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 font-semibold',
    draft:
      'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    featured:
      'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 font-semibold',
    verified:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    outline:
      'border border-casa-border-medium text-casa-text-secondary bg-transparent',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium select-none shadow-2xs',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
