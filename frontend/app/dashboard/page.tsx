'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Home,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Users,
  CheckCircle,
} from 'lucide-react';

export default function RoleBasedDashboardHubPage() {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();
  const router = useRouter();

  // Automatic role-based redirect on load
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'DEVELOPER') {
        router.replace('/dashboard/developer');
      } else if (user.role === 'BROKER') {
        router.replace('/dashboard/broker');
      } else if (user.role === 'AGENT' || user.role === 'VERIFIED_AGENT') {
        router.replace('/dashboard/agent');
      } else if (user.role === 'PROPERTY_OWNER') {
        router.replace('/dashboard/properties');
      } else if (user.role === 'TENANT') {
        router.replace('/dashboard/tenant');
      } else if (user.role === 'BUYER' || user.role === 'PURCHASER') {
        router.replace('/dashboard/purchaser');
      }
      // For Admin/Super Admin, we remain here to show the Admin Control Hub or allow them to jump
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="h-28 bg-casa-surface border border-casa-border-light rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-48 bg-casa-surface border border-casa-border-light rounded-2xl animate-pulse" />
          <div className="h-48 bg-casa-surface border border-casa-border-light rounded-2xl animate-pulse" />
          <div className="h-48 bg-casa-surface border border-casa-border-light rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6 text-start">
        <div className="w-16 h-16 rounded-3xl bg-casa-brand-subtle text-casa-brand flex items-center justify-center mx-auto shadow-subtle">
          <Layers className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-casa-text-primary">
            CASA Role-Based Portal
          </h1>
          <p className="text-sm text-casa-text-secondary mt-2 max-w-lg mx-auto">
            Please sign in to access your tailored dashboard for Buyers, Property Owners, or Real Estate Brokers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-start">
          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle space-y-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-casa-text-primary">Buyer Portal</h3>
              <p className="text-xs text-casa-text-muted mt-0.5">
                Saved properties, direct enquiries & curated recommendations.
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle space-y-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-casa-text-primary">Seller Portal</h3>
              <p className="text-xs text-casa-text-muted mt-0.5">
                List homes, manage drafts & track incoming buyer interest.
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle space-y-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-casa-text-primary">Broker Console</h3>
              <p className="text-xs text-casa-text-muted mt-0.5">
                Real-time leads, RERA verification & verified agent badges.
              </p>
            </div>
          </Card>
        </div>

        <div className="pt-4">
          <Button variant="primary" size="lg" onClick={openAuthModal} className="shadow-subtle px-8 font-bold">
            <span>Sign In or Register</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Admin / Super Admin Hub View
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 text-start">
      {/* Top Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-casa-brand/10 via-casa-surface to-casa-brand/5 border border-casa-brand/20 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-casa-brand text-white">
              {user.role.replace('_', ' ')}
            </span>
            <span className="text-xs text-casa-text-muted font-medium">Logged in as {user.name}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
            CASA Marketplace & Role Command Center
          </h1>
          <p className="text-xs md:text-sm text-casa-text-secondary max-w-xl">
            As a system administrator, you have full omni-channel access to all role portals, moderation queues, and the CASA Governance Admin System.
          </p>
        </div>

        <a
          href={process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="primary" size="md" className="shadow-subtle font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Open Admin Portal (:3001)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>

      {/* Role Navigation Cards */}
      <div>
        <h2 className="text-base font-bold text-casa-text-primary mb-4">
          Switch to Dedicated Role Dashboards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Broker / Agent Dashboard */}
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between space-y-6 hover:border-casa-brand/40 transition-all">
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-2xl w-fit">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Broker & Agent Command</h3>
                <p className="text-xs text-casa-text-secondary mt-1 leading-relaxed">
                  Real-time CRM lead routing, RERA credentials verification, active client listing management, and agency performance analytics.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-casa-text-muted">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Buyer Leads CRM Feed
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> RERA Verification Status
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Agent Public Directory Profile
                </li>
              </ul>
            </div>
            <Link href="/dashboard/agent">
              <Button variant="outline" size="sm" fullWidth className="font-bold flex items-center justify-center gap-1">
                <span>Access Broker Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>

          {/* 2. Seller & Property Owner Dashboard */}
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between space-y-6 hover:border-casa-brand/40 transition-all">
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-2xl w-fit">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Seller & Owner Listings</h3>
                <p className="text-xs text-casa-text-secondary mt-1 leading-relaxed">
                  Publish flats, villas, plots, or commercial units with 8-step wizard, review pending moderation status, and feature listings.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-casa-text-muted">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Property Drafts & Published Ads
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Moderation Status Tracker
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Listing Monetization & Featured
                </li>
              </ul>
            </div>
            <Link href="/dashboard/properties">
              <Button variant="outline" size="sm" fullWidth className="font-bold flex items-center justify-center gap-1">
                <span>Access Seller Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>

          {/* 3. Buyer / Purchaser Dashboard */}
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between space-y-6 hover:border-casa-brand/40 transition-all">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl w-fit">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">Buyer & Purchaser Hub</h3>
                <p className="text-xs text-casa-text-secondary mt-1 leading-relaxed">
                  Bookmark favorite properties, track submitted WhatsApp & telephone enquiries, schedule verified site visits, and configure alerts.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-casa-text-muted">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Saved Properties & Favorites
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Direct Enquiry Tracking
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Site Visit Appointments
                </li>
              </ul>
            </div>
            <Link href="/dashboard/purchaser">
              <Button variant="outline" size="sm" fullWidth className="font-bold flex items-center justify-center gap-1">
                <span>Access Buyer Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
