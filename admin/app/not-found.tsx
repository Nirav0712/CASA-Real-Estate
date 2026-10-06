import Link from 'next/link';
import { Button, Card } from '@/components/ui/button';
import { LayoutDashboard, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-16">
      <Card className="max-w-md mx-auto text-center p-8">
        <div className="w-12 h-12 rounded-xl bg-casa-subtle text-casa-brand flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-casa-text-primary mb-2">
          Admin Route Not Found
        </h2>
        <p className="text-xs text-casa-text-secondary leading-relaxed mb-6">
          The administrative view, moderation queue, or settings panel you requested does not exist.
        </p>
        <Link href="/">
          <Button variant="primary" size="sm">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </Card>
    </div>
  );
}
