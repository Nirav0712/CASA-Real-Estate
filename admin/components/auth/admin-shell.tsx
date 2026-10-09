'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar, AdminHeader } from '@/components/layout/sidebar';
import { useAdminAuth } from '@/contexts/auth-context';
import { AdminOnboardingBanner } from './admin-onboarding-banner';
import { Loader2 } from 'lucide-react';

const PUBLIC_AUTH_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAdminAuth();

  const isAuthPage = PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname?.startsWith(p));

  if (isAuthPage) {
    return <div className="flex-1 w-full min-h-screen flex flex-col">{children}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-casa-canvas">
        <div className="flex items-center gap-3 p-4 bg-casa-surface rounded-2xl shadow-subtle border border-casa-border-light">
          <Loader2 className="w-5 h-5 text-casa-brand animate-spin" />
          <span className="text-xs font-semibold text-casa-text-primary">
            Authenticating Administrative Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Next router will redirect to /login
  }

  return (
    <div className="flex-1 flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <AdminOnboardingBanner />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
