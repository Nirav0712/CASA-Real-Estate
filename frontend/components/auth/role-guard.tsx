'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogIn, ArrowRight, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  dashboardName: string;
  loginPrompt?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  dashboardName,
  loginPrompt = 'Please sign in with an authorized account to access this workspace.',
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-casa-brand animate-spin" />
        <p className="text-casa-text-muted font-medium text-xs">
          Verifying {dashboardName} authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-casa-brand/10 text-casa-brand rounded-2xl flex items-center justify-center mb-4 shadow-subtle">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-casa-text-primary mb-2">
          {dashboardName} Sign In Required
        </h2>
        <p className="text-casa-text-secondary text-sm mb-6 leading-relaxed">
          {loginPrompt}
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={openAuthModal}
          className="shadow-elevated"
        >
          <span>Sign In / Register</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    );
  }

  // Check role authorization with authoritative platformRole and accountType
  const isSuperAdmin =
    user.platformRole === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN';
  const hasAccess =
    isSuperAdmin ||
    (user.platformRole && allowedRoles.includes(user.platformRole as any)) ||
    (user.accountType && allowedRoles.includes(user.accountType as any)) ||
    allowedRoles.includes(user.role) ||
    (allowedRoles.includes('BUYER') && (user.accountType === 'BUYER' || user.role === 'PURCHASER')) ||
    (allowedRoles.includes('PURCHASER') && (user.accountType === 'BUYER' || user.role === 'BUYER')) ||
    (allowedRoles.includes('AGENT') && (user.accountType === 'AGENT' || user.role === 'VERIFIED_AGENT'));

  if (!hasAccess) {
    const currentDisplayRole = user.accountType || user.platformRole || user.role || 'USER';
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-subtle border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-casa-text-primary mb-2">
          Access Restricted (403)
        </h2>
        <p className="text-casa-text-secondary text-sm mb-6 leading-relaxed">
          Your account is registered as <strong className="uppercase text-casa-brand font-bold">{currentDisplayRole.replace('_', ' ')}</strong>, which does not have permission to access the <strong>{dashboardName}</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/dashboard')}
          >
            <span>Go to My Dashboard</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push('/')}
          >
            <span>Back to Marketplace</span>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
