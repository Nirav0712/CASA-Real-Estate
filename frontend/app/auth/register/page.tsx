'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal, isAuthenticated } = useAuth();

  const redirectUrl = React.useMemo(() => {
    const fromQuery =
      searchParams.get('redirect') ||
      searchParams.get('callbackUrl') ||
      searchParams.get('returnUrl');
    if (fromQuery) return fromQuery;

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('casa_login_intent');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.continueUrl) return parsed.continueUrl;
          if (parsed?.propertySlug) return `/property/${parsed.propertySlug}`;
        }
      } catch {}
    }
    return '/';
  }, [searchParams]);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    } else {
      openAuthModal('REGISTER');
    }
  }, [openAuthModal, router, isAuthenticated, redirectUrl]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}
