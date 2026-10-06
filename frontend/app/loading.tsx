'use client';

import { Container } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="py-20">
      <Container>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-10 h-10 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-casa-text-secondary">
            Loading CASA Marketplace...
          </p>
        </div>
      </Container>
    </div>
  );
}
