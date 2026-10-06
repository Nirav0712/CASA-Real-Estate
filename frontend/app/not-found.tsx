import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16">
      <Container>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-casa-brand-subtle text-casa-brand flex items-center justify-center mx-auto text-2xl font-bold shadow-subtle">
            404
          </div>
          <div>
            <h1 className="text-2xl font-bold text-casa-text-primary mb-2">
              Page Not Found
            </h1>
            <p className="text-xs text-casa-text-muted leading-relaxed">
              The property listing, neighborhood directory, or page you were looking for does not exist or has been moved.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link href="/">
              <Button variant="primary" size="md">
                <Home className="w-4 h-4" />
                <span>Return to Marketplace</span>
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
