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
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  // Automatically dismiss mobile drawer when navigating between pages
  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const isAuthPage = PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname?.startsWith(p));

  if (isAuthPage) {
    return <div className="flex-1 w-full min-h-screen flex flex-col">{children}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-casa-canvas p-4">
        <div className="flex items-center gap-3 p-4 bg-casa-surface rounded-2xl shadow-subtle border border-casa-border-light max-w-sm text-center">
          <Loader2 className="w-5 h-5 text-casa-brand animate-spin shrink-0" />
          <span className="text-xs font-semibold text-casa-text-primary truncate">
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
    <div className="flex-1 flex min-h-screen w-full overflow-x-hidden bg-casa-canvas">
      {/* Responsive Sidebar (Desktop persistent + Mobile drawer) */}
      <AdminSidebar
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <AdminHeader onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)} />
        <AdminOnboardingBanner />
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 overflow-y-auto min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
