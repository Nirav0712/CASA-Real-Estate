'use client';

import { useEffect } from 'react';
import { Button, Card } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CASA Admin Client Error:', error);
  }, [error]);

  return (
    <div className="py-16">
      <Card className="max-w-md mx-auto text-center p-8">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-casa-text-primary mb-2">
          Admin Portal Error
        </h2>
        <p className="text-xs text-casa-text-secondary leading-relaxed mb-6">
          An error occurred in the governance application. The error state was isolated safely.
        </p>
        <Button variant="primary" size="sm" onClick={() => reset()}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Portal View</span>
        </Button>
      </Card>
    </div>
  );
}
