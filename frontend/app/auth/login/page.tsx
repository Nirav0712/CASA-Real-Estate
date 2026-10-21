'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal, isAuthenticated } = useAuth();
  const [deactivatedMsg, setDeactivatedMsg] = React.useState<string | null>(null);

  const isDeactivated = searchParams.get('deactivated') === '1';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNotice = localStorage.getItem('casa_deactivated_notice');
      if (isDeactivated || storedNotice) {
        setDeactivatedMsg('Your account has been deactivated by the administrator.');
        try {
          localStorage.removeItem('casa_deactivated_notice');
        } catch {
          // ignore
        }
      }
    }
  }, [isDeactivated]);

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
      {deactivatedMsg && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{deactivatedMsg}</span>
        </div>
      )}
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

