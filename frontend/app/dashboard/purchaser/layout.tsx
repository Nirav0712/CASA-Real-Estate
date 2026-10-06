'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Container } from '@/components/ui/card';
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  Clock,
  SlidersHorizontal,
  Compass,
  ArrowLeft,
  User as UserIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/dashboard/purchaser',
    label: 'Overview',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/dashboard/purchaser/saved',
    label: 'Saved Properties',
    icon: Heart,
  },
  {
    href: '/dashboard/purchaser/enquiries',
    label: 'My Enquiries',
    icon: MessageSquare,
  },
  {
    href: '/dashboard/purchaser/recent',
    label: 'Recently Viewed',
    icon: Clock,
  },
  {
    href: '/dashboard/purchaser/profile',
    label: 'Buyer Profile',
    icon: SlidersHorizontal,
  },
];

export default function PurchaserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-casa-text-muted font-medium text-sm">Loading Buyer Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-casa-brand rounded-full flex items-center justify-center mb-4 shadow-subtle">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-casa-text-primary mb-2">Purchaser Sign In Required</h2>
        <p className="text-casa-text-secondary max-w-md mb-6 text-sm">
          Please sign in with your mobile number to access your saved properties, active property enquiries, and personalized recommendations.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 bg-casa-brand text-white font-semibold rounded-xl hover:bg-casa-brand-dark transition shadow-lg shadow-casa-brand/20 cursor-pointer text-sm"
        >
          Sign In to Purchaser Account
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-casa-canvas py-6 md:py-10">
      <Container>
        {/* Navigation Bar / Tabs */}
        <div className="mb-8 border-b border-casa-border-light pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                title="Back to Marketplace"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-casa-text-primary tracking-tight">
                  Buyer Workspace
                </h1>
                <p className="text-xs text-casa-text-muted">
                  Logged in as <span className="font-semibold text-casa-text-primary">{user?.name || user?.normalizedMobile}</span> ({user?.role})
                </p>
              </div>
            </div>

            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-casa-brand text-white text-xs font-bold hover:bg-casa-brand-dark transition shadow-sm w-fit"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </Link>
          </div>

          {/* Tab Links */}
          <nav aria-label="Purchaser Navigation Tabs" className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-casa-brand text-white shadow-xs'
                      : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Child Page Content */}
        {children}
      </Container>
    </div>
  );
}
