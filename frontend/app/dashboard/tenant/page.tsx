'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Key,
  Search,
  Heart,
  MessageSquare,
  Calendar,
  Clock,
  Compass,
  Building,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleGuard
      allowedRoles={['TENANT', 'BUYER', 'PURCHASER', 'ADMIN', 'SUPER_ADMIN']}
      dashboardName="Tenant Rental Portal"
      loginPrompt="Sign in to your CASA Tenant account to search verified rental flats, track tenancy enquiries, and book apartment visits."
    >
      <div className="min-h-screen bg-casa-canvas py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-start">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white p-6 md:p-8 rounded-3xl shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold backdrop-blur-sm border border-teal-500/30">
                <Key className="w-3.5 h-3.5" />
                <span>Tenant Rental Space</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Tenant'}
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl">
                Browse zero-brokerage verified rental homes, schedule in-person site inspections, and communicate directly with property owners.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/properties?listingType=RENT">
                <Button variant="primary" size="md" className="shadow-lg bg-teal-600 hover:bg-teal-700">
                  <Search className="w-4 h-4 mr-2" />
                  <span>Find Rental Properties</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Saved Rentals</p>
              <h3 className="text-xl font-bold text-casa-text-primary">Saved Homes</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Rental Enquiries</p>
              <h3 className="text-xl font-bold text-casa-text-primary">Direct Responses</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Site Visits</p>
              <h3 className="text-xl font-bold text-casa-text-primary">Visits Scheduled</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Verified Tenancy</p>
              <h3 className="text-xl font-bold text-casa-text-primary">Protected Lease</h3>
            </div>
          </Card>
        </div>

        {/* Tenant Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600" />
                <span>Search Rental Listings</span>
              </h3>
              <Link href="/properties?listingType=RENT" className="text-xs font-semibold text-teal-600 hover:underline">
                Explore
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Filter by furnished/unfurnished, monthly budget, pet-friendly amenities, and immediate availability.
            </p>
            <div className="pt-2">
              <Link href="/properties?listingType=RENT">
                <Button variant="outline" size="sm" fullWidth>
                  <span>Browse Flats for Rent</span>
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Saved Rental Properties</span>
              </h3>
              <Link href="/dashboard/purchaser/saved" className="text-xs font-semibold text-rose-500 hover:underline">
                View Saved
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Review shortlisted apartments, compare deposits and security requirements side-by-side.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/purchaser/saved">
                <Button variant="outline" size="sm" fullWidth>
                  <span>Open Saved Rentals</span>
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>My Owner Enquiries</span>
              </h3>
              <Link href="/dashboard/purchaser/enquiries" className="text-xs font-semibold text-blue-600 hover:underline">
                Messages
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Direct communications with verified property owners and certified leasing managers.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/purchaser/enquiries">
                <Button variant="outline" size="sm" fullWidth>
                  <span>View Messages</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
