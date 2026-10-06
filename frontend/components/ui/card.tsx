import * as React from 'react';
import { cn } from '@/lib/utils';

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

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pb-3 border-b border-casa-border-light', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-bold text-casa-text-primary tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-casa-text-muted mt-1 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-5 pt-3 border-t border-casa-border-light bg-casa-canvas/50 flex items-center justify-between',
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
    | 'featured'
    | 'verified'
    | 'ready'
    | 'pending'
    | 'active'
    | 'rejected'
    | 'draft'
    | 'litigated'
    | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const variants = {
    default:
      'bg-casa-subtle text-casa-text-secondary border border-casa-border-light dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    featured:
      'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 font-semibold',
    verified:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    ready:
      'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800',
    pending:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 font-semibold',
    active:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    rejected:
      'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 font-semibold',
    draft:
      'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    litigated:
      'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 font-semibold',
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

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full', className)}>
      {children}
    </div>
  );
}
