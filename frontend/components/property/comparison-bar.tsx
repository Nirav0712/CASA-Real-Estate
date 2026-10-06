'use client';

import * as React from 'react';
import Link from 'next/link';
import { useComparison } from '@/contexts/comparison-context';
import { Layers, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ComparisonBar() {
  const { comparedIds, clearCompare } = useComparison();

  if (comparedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-bottom-5">
      <div className="bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-zinc-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-casa-brand/20 text-casa-brand flex items-center justify-center font-bold text-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Compare Properties</div>
            <div className="text-xs text-zinc-400">
              {comparedIds.length} of 4 selected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearCompare}
            className="text-xs text-zinc-400 hover:text-white px-2 h-8"
          >
            Clear
          </Button>

          <Link href="/compare">
            <Button size="sm" className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs h-8 flex items-center gap-1.5 shadow-md">
              <span>Compare Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
