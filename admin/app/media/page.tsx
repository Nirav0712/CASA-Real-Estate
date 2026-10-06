'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload } from 'lucide-react';

export default function MediaLibraryPage() {
  const images = [
    { name: 'villa-exterior-elevation.jpg', size: '1.2 MB', category: 'House / Home', uploadedAt: '2026-10-02' },
    { name: 'retail-shop-frontage.jpg', size: '840 KB', category: 'Shop', uploadedAt: '2026-10-04' },
    { name: 'commercial-corporate-floor.jpg', size: '2.1 MB', category: 'Office Space', uploadedAt: '2026-09-28' },
    { name: 'agricultural-land-aerial.jpg', size: '3.4 MB', category: 'Farm Land', uploadedAt: '2026-09-30' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Media Library & ImageKit CDN
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Optimized high-resolution property photography, blueprint PDFs, and floor plans.
          </p>
        </div>

        <Button variant="primary" size="sm" className="text-xs">
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <Card key={img.name} className="p-3 bg-casa-surface border border-casa-border-light shadow-subtle space-y-2.5">
            <div className="h-32 bg-casa-subtle/80 rounded-lg flex items-center justify-center text-casa-text-muted">
              <ImageIcon className="w-8 h-8 opacity-40" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-xs text-casa-text-primary truncate" title={img.name}>
                {img.name}
              </div>
              <div className="flex items-center justify-between text-[11px] text-casa-text-muted">
                <span>{img.category}</span>
                <span>{img.size}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
