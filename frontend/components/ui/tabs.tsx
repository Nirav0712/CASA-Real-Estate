'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs({
  items,
  activeTab,
  onChange,
  variant = 'pill',
  className,
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar',
        variant === 'underline' && 'border-b border-casa-border-light pb-px',
        className,
      )}
    >
      {items.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer whitespace-nowrap',
                isActive
                  ? 'border-casa-brand text-casa-brand'
                  : 'border-transparent text-casa-text-secondary hover:text-casa-text-primary hover:border-casa-border-medium',
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isActive
                      ? 'bg-casa-brand-subtle text-casa-brand'
                      : 'bg-casa-subtle text-casa-text-muted',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        // Pill variant
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none',
              isActive
                ? 'bg-casa-brand text-white shadow-subtle'
                : 'bg-casa-subtle text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-muted',
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-casa-muted text-casa-text-muted',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
