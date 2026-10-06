'use client';

import * as React from 'react';
import { Card } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguagesPage() {
  const languages = [
    { code: 'en', name: 'English', direction: 'LTR', coverage: '100%', status: 'PRIMARY_DEFAULT' },
    { code: 'hi', name: 'Hindi (हिंदी)', direction: 'LTR', coverage: '98%', status: 'ACTIVE' },
    { code: 'ar', name: 'Arabic (العربية)', direction: 'RTL', coverage: '92%', status: 'ACTIVE' },
    { code: 'ur', name: 'Urdu (اردو)', direction: 'RTL', coverage: '90%', status: 'ACTIVE' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Multi-Lingual Localization & RTL
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Translations for 4 core supported languages across CASA marketplace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {languages.map((l) => (
          <Card key={l.code} className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                  {l.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-casa-brand-subtle text-casa-brand">
                  {l.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-casa-text-primary">{l.name}</h3>
              <div className="text-xs text-casa-text-muted">Layout: Direction ({l.direction})</div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">{l.coverage}</div>
              <span className="text-[10px] text-casa-text-muted">Dictionary Translated</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
