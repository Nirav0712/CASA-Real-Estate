'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal, isAuthenticated } = useAuth();

  const redirectUrl =
    searchParams.get('redirect') ||
    searchParams.get('callbackUrl') ||
    searchParams.get('returnUrl') ||
    '/dashboard/properties/new';

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    } else {
      openAuthModal('SIGN_IN');
    }
  }, [openAuthModal, router, isAuthenticated, redirectUrl]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-4">
      <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-casa-text-secondary">Redirecting to sign in...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
