'use client';

import { useEffect } from 'react';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log client error to logging endpoint
    console.error('CASA Client Error:', error);
  }, [error]);

  return (
    <div className="py-24">
      <Container>
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl border border-casa-border-light shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-casa-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-casa-text-secondary leading-relaxed mb-6">
            An unexpected error occurred while loading this page. The application caught this error safely.
          </p>
          <Button variant="primary" onClick={() => reset()}>
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </Container>
    </div>
  );
}
