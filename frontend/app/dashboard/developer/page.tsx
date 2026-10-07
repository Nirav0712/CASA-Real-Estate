'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  PlusCircle,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  TrendingUp,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export default function DeveloperDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleGuard
      allowedRoles={['DEVELOPER', 'ADMIN', 'SUPER_ADMIN']}
      dashboardName="Property Developer Console"
      loginPrompt="Sign in with your Property Developer account to manage township projects, inventory, builder leads, and sales analytics."
    >
      <div className="min-h-screen bg-casa-canvas py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-start">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-casa-brand/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-casa-brand-subtle text-xs font-semibold backdrop-blur-sm">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Developer Enterprise Workspace</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name || user?.agencyName || 'Property Developer'}
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl">
                Manage commercial & residential developments, project phases, digital master plans, and direct buyer inquiries.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/properties/new">
                <Button variant="primary" size="md" className="shadow-lg">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>Add Project Listing</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Active Projects</p>
              <h3 className="text-xl font-bold text-casa-text-primary">3 Developments</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Project Inquiries</p>
              <h3 className="text-xl font-bold text-casa-text-primary">28 Qualified Leads</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Site Visits</p>
              <h3 className="text-xl font-bold text-casa-text-primary">12 Scheduled</h3>
            </div>
          </Card>

          <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-casa-text-muted font-medium">Project Views</p>
              <h3 className="text-xl font-bold text-casa-text-primary">4,520 Impressions</h3>
            </div>
          </Card>
        </div>

        {/* Developer Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Projects Module */}
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-casa-brand" />
                <span>My Projects & Inventory</span>
              </h3>
              <Link href="/dashboard/properties" className="text-xs font-semibold text-casa-brand hover:underline">
                View All
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Upload master floorplans, brochure PDFs, construction status updates, and RERA registration documents.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/properties/new">
                <Button variant="outline" size="sm" fullWidth>
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Create New Phase</span>
                </Button>
              </Link>
            </div>
          </Card>

          {/* Leads & Buyer Intent */}
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Developer CRM & Leads</span>
              </h3>
              <Link href="/dashboard/agent/leads" className="text-xs font-semibold text-emerald-600 hover:underline">
                CRM Portal
              </Link>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Track customer inquiries by project phase, schedule site walk-throughs, and log sales call notes.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/agent/leads">
                <Button variant="outline" size="sm" fullWidth>
                  <span>Open Lead Manager</span>
                </Button>
              </Link>
            </div>
          </Card>

          {/* Developer Analytics */}
          <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Market & Sales Insights</span>
              </h3>
            </div>
            <p className="text-xs text-casa-text-secondary">
              Monitor click-through rates, brochure downloads, and high-intent buyer demographics across your properties.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/agent/verification">
                <Button variant="outline" size="sm" fullWidth>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  <span>RERA Verification</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
