import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'p-12 text-center bg-casa-surface border border-casa-border-light rounded-3xl shadow-subtle max-w-md mx-auto my-8 flex flex-col items-center justify-center',
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-casa-subtle text-casa-brand flex items-center justify-center mb-4 shadow-2xs">
        {icon || <Search className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-casa-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-casa-text-muted leading-relaxed mb-6 max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
