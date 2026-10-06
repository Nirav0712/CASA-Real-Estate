'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { getAgentDashboard } from '@/services/agent-service';
import { AgentDashboardData } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  Building2,
  Users,
  ShieldCheck,
  Clock,
  Plus,
  ArrowRight,
  FileCheck2,
  Phone,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function AgentDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();

  const [dashboard, setDashboard] = React.useState<AgentDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getAgentDashboard();
      setDashboard(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load agent dashboard.';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadData]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Agent Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-casa-50 text-casa-600 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Workspace Login Required</h2>
        <p className="text-slate-600 max-w-md mb-6">
          Sign in with your registered agent mobile number to access real-time leads, property analytics, and RERA verification.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 bg-casa-600 text-white font-semibold rounded-xl hover:bg-casa-700 transition shadow-lg shadow-casa-600/20"
        >
          Sign In as Agent
        </button>
      </div>
    );
  }

  const isVerified = dashboard?.agent?.isVerifiedAgent;
  const verificationStatus = dashboard?.agent?.verificationStatus || 'NOT_SUBMITTED';
  const profileSlug = dashboard?.profile?.slug || `agent-${user?.id}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {dashboard?.profile?.displayName || user?.name || 'Agent'}!
            </h1>
            {isVerified ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                CASA Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {verificationStatus === 'PENDING' ? 'Verification Pending' : 'Verification Incomplete'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {dashboard?.profile?.agencyName ? `${dashboard.profile.agencyName} • ` : ''}
            Manage your property inventory, buyer leads, and official CASA business profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center px-4 py-2.5 bg-casa-600 text-white text-sm font-medium rounded-xl hover:bg-casa-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Property
          </Link>
          <Link
            href={`/agents/${profileSlug}`}
            target="_blank"
            className="inline-flex items-center px-4 py-2.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition border border-slate-200"
          >
            <ExternalLink className="w-4 h-4 mr-1.5 text-slate-500" />
            Public Profile
          </Link>
        </div>
      </div>

      {/* Verification Notice Banner if not verified */}
      {!isVerified && (
        <div className="bg-gradient-to-r from-casa-50 to-indigo-50 border border-casa-100 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-white rounded-xl shadow-xs text-casa-600 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {verificationStatus === 'PENDING'
                  ? 'Your RERA verification is under admin review'
                  : 'Get the CASA Verified Agent Badge'}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {verificationStatus === 'PENDING'
                  ? 'Our compliance team is auditing your RERA certificate and documents.'
                  : 'Verified agents receive higher listing rankings, verified badges, and up to 3x more buyer enquiries.'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/agent/verification"
            className="inline-flex items-center px-4 py-2 bg-white text-casa-700 text-sm font-semibold rounded-xl border border-casa-200 hover:bg-casa-50 transition shadow-xs whitespace-nowrap"
          >
            {verificationStatus === 'PENDING' ? 'Check Status' : 'Start Verification'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Listings</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{dashboard?.counts?.totalListings ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-600 font-semibold">{dashboard?.counts?.publishedListings ?? 0} Live</span>
              <span>•</span>
              <span>{dashboard?.counts?.pendingReviewListings ?? 0} In Review</span>
            </div>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Buyer Leads</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{dashboard?.counts?.totalLeads ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="text-casa-600 font-semibold">{dashboard?.counts?.newLeads ?? 0} New Uncontacted</span>
            </div>
          </div>
        </div>

        {/* Follow-ups Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Follow-ups Due</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{dashboard?.counts?.followUpsDue ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">
              Scheduled tasks for today
            </div>
          </div>
        </div>

        {/* Verified Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">RERA Status</span>
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-900 truncate">
              {dashboard?.profile?.reraNumber || 'Not Registered'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isVerified ? 'CASA Verified & Authorized' : 'Pending Verification'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/leads"
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-casa-200 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-casa-50 text-casa-600 rounded-xl group-hover:bg-casa-600 group-hover:text-white transition">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-casa-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-4">Lead Management CRM</h3>
          <p className="text-sm text-slate-500 mt-1">
            Track inquiries, update contact status, log meeting notes, and manage buyer follow-ups.
          </p>
        </Link>

        <Link
          href="/dashboard/properties"
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-casa-200 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
              <Layers className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-4">Property Inventory</h3>
          <p className="text-sm text-slate-500 mt-1">
            Create, edit, submit, and track the status of all your residential and commercial listings.
          </p>
        </Link>

        <Link
          href="/dashboard/agent/profile"
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-casa-200 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <UserCheck className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-4">Business Profile & RERA</h3>
          <p className="text-sm text-slate-500 mt-1">
            Update agency branding, areas served, languages, and upload RERA compliance certificates.
          </p>
        </Link>
      </div>

      {/* Two Column Section: Recent Leads & Recent Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries / Leads */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-slate-900">Recent Inquiries</h2>
              <p className="text-xs text-slate-500">Live enquiries routed to you from published properties</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-semibold text-casa-600 hover:text-casa-700 flex items-center"
            >
              View All Leads <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {(!dashboard?.recentLeads || dashboard.recentLeads.length === 0) ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No customer enquiries received yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Leads from your published listings will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.recentLeads.map((lead) => (
                <div
                  key={lead._id || lead.id}
                  className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{lead.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700">
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{lead.propertyTitle || 'Property Enquiry'}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {lead.mobile}</span>
                      <span>•</span>
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/leads?id=${lead._id || lead.id}`}
                    className="p-2 bg-white text-slate-600 hover:text-casa-600 border border-slate-200 rounded-lg shrink-0 shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-slate-900">Your Listings</h2>
              <p className="text-xs text-slate-500">Recently managed properties in your portfolio</p>
            </div>
            <Link
              href="/dashboard/properties"
              className="text-xs font-semibold text-casa-600 hover:text-casa-700 flex items-center"
            >
              Manage All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {(!dashboard?.recentListings || dashboard.recentListings.length === 0) ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No properties in your catalog yet.</p>
              <Link
                href="/dashboard/properties/new"
                className="mt-3 inline-flex items-center text-xs font-semibold text-casa-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.recentListings.map((prop) => (
                <div
                  key={prop.id}
                  className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {typeof prop.title === 'string' ? prop.title : prop.title?.en || 'Listing'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prop.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : prop.status === 'PENDING_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-casa-600">
                      {formatPrice(typeof prop.price === 'number' ? prop.price : prop.price?.amount || 0)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {prop.location?.city || ''}{prop.location?.state ? `, ${prop.location.state}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/properties/${prop.id}/edit`}
                    className="p-2 bg-white text-slate-600 hover:text-casa-600 border border-slate-200 rounded-lg shrink-0 shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
