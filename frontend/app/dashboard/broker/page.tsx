'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  Briefcase,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  ArrowRight,
} from 'lucide-react';

export default function BrokerDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleGuard
      allowedRoles={['BROKER', 'ADMIN', 'SUPER_ADMIN']}
      dashboardName="Real Estate Broker Console"
      loginPrompt="Sign in with your Broker credentials to manage brokerage listings, agent networks, buyer leads, and verified commission deals."
    >
      <div className="min-h-screen bg-casa-canvas py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-start">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-6 md:p-8 rounded-3xl shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold backdrop-blur-sm border border-amber-500/30">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Licensed Broker Workspace</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {user?.name || user?.agencyName || 'Brokerage Firm'}
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl">
                Manage commercial portfolios, high-ticket residential listings, verified agent partnerships, and active client pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/properties/new">
                <Button variant="primary" size="md" className="shadow-lg bg-amber-600 hover:bg-amber-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>List Mandated Property</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Brokerage Listings</p>
              <h3 className="text-xl font-bold text-casa-text-primary">16 Properties</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Active High-Intent Leads</p>
              <h3 className="text-xl font-bold text-casa-text-primary">42 Clients</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Direct Inquiries</p>
              <h3 className="text-xl font-bold text-casa-text-primary">19 Pending</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Broker License</p>
              <h3 className="text-xl font-bold text-casa-text-primary">RERA Registered</h3>
            </div>
          </Card>
        </div>

        {/* Broker Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>My Mandates & Listings</span>
              </h3>
              <Link href="/dashboard/properties" className="text-xs font-semibold text-amber-600 hover:underline">
                Manage
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Update pricing, upload walkthrough videos, submit listings for moderation, and manage featured property promotions.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/properties">
                <Button variant="outline" size="sm" fullWidth>
                  <span>View All Mandates</span>
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Client Leads & CRM</span>
              </h3>
              <Link href="/dashboard/agent/leads" className="text-xs font-semibold text-emerald-600 hover:underline">
                Open CRM
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Access real-time lead notifications, buyer contact details, site visit schedules, and transaction stage tracking.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/agent/leads">
                <Button variant="outline" size="sm" fullWidth>
                  <span>Manage Leads</span>
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-casa-brand" />
                <span>RERA & Profile Badges</span>
              </h3>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Keep your agency credentials and broker certificates up-to-date to retain CASA Verified Broker trust badges.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/agent/verification">
                <Button variant="outline" size="sm" fullWidth>
                  <span>Verification Center</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
