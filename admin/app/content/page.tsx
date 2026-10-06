'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { FileText, Edit3, Globe } from 'lucide-react';

export default function ContentCMSPage() {
  const pages = [
    { slug: 'about-us', title: 'About CASA Real Estate', lastEdited: '2026-09-28', status: 'PUBLISHED', locale: 'en, hi, ar, ur' },
    { slug: 'terms-and-conditions', title: 'Terms of Service & Platform Rules', lastEdited: '2026-10-01', status: 'PUBLISHED', locale: 'en, hi' },
    { slug: 'privacy-policy', title: 'Data Privacy & GDPR Compliance', lastEdited: '2026-10-01', status: 'PUBLISHED', locale: 'en, hi' },
    { slug: 'rera-guidelines', title: 'RERA Compliance & Buyer Safety Advisory', lastEdited: '2026-09-30', status: 'PUBLISHED', locale: 'en, hi, ar, ur' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Static Pages & CMS Content
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Manage legal disclosures, buyer education guides, and platform terms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((p) => (
          <Card key={p.slug} className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                  /{p.slug}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {p.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-casa-text-primary">{p.title}</h3>
              <div className="text-xs text-casa-text-muted flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Locales: {p.locale}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-casa-border-light">
              <span className="text-[11px] text-casa-text-muted">Updated {p.lastEdited}</span>
              <Button variant="outline" size="sm" className="text-xs">
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Markdown
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
