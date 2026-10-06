'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  const { isRtl } = useLanguage();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-casa-overlay backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
      />

      {/* Drawer Surface */}
      <div
        className={cn(
          'relative w-full max-w-xs sm:max-w-sm bg-casa-surface h-full shadow-elevated z-10 flex flex-col transition-transform duration-300 ease-in-out',
          isRtl
            ? 'ms-auto animate-in slide-in-from-left'
            : 'ms-auto animate-in slide-in-from-right',
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-casa-border-light flex items-center justify-between">
          <span className="font-bold text-base text-casa-text-primary">
            {title || 'Menu'}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
