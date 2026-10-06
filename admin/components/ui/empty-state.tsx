import * as React from 'react';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';
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
        'p-10 text-center bg-casa-surface border border-casa-border-light rounded-3xl shadow-subtle max-w-sm mx-auto my-8 flex flex-col items-center justify-center',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-casa-subtle text-casa-brand flex items-center justify-center mb-3.5 shadow-2xs">
        {icon || <Layers className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-bold text-casa-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-casa-text-muted leading-relaxed mb-5 max-w-xs">
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
