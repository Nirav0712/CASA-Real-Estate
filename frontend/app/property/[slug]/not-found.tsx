import Link from 'next/link';
import { Container, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function PropertyNotFound() {
  return (
    <div className="py-20 md:py-28 bg-casa-canvas text-center">
      <Container>
        <Card className="max-w-lg mx-auto p-8 md:p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-casa-brand mb-2">
            Status: 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-casa-text-primary mb-3">
            Property Not Found
          </h1>
          <p className="text-sm text-casa-text-secondary leading-relaxed mb-8 max-w-sm">
            The property listing you are looking for is no longer active, has been rented/sold, or the URL slug is incorrect.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/">
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                <Home className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
            <Link href="/#categories">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                <Search className="w-4 h-4" />
                <span>Browse Categories</span>
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
