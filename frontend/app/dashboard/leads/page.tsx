'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getMyLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadPriority,
  addLeadNote,
  setLeadFollowUp,
  completeFollowUp,
  cancelFollowUp,
} from '@/services/lead-service';
import { Lead, LeadStatus, LeadPriority, PaginatedResponse } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  TrendingUp,
  FileText,
} from 'lucide-react';

const STATUS_TABS: { label: string; value?: LeadStatus }[] = [
  { label: 'All Leads' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Qualified', value: 'QUALIFIED' },
  { label: 'Site Visit', value: 'SITE_VISIT' },
  { label: 'Negotiation', value: 'NEGOTIATION' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Closed / Lost', value: 'CLOSED' },
];

function formatSafeDate(dateValue?: string | Date | null): string {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  } catch {
    return '-';
  }
}

function formatSafeDateTime(dateValue?: string | Date | null): string {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString();
  } catch {
    return '-';
  }
}

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();

  const [leadsData, setLeadsData] = React.useState<PaginatedResponse<Lead>>({
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });

  const [selectedStatus, setSelectedStatus] = React.useState<LeadStatus | undefined>();
  const [selectedPriority, setSelectedPriority] = React.useState<LeadPriority | undefined>();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // Detail Drawer State
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [noteInput, setNoteInput] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [followUpNote, setFollowUpNote] = React.useState('');
  const [isActionPending, setIsActionPending] = React.useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = React.useState(false);

  const loadLeads = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await getMyLeads({
        page,
        limit: 10,
        status: selectedStatus,
        priority: selectedPriority,
        search: searchQuery || undefined,
      });
      setLeadsData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load leads.';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, selectedStatus, selectedPriority, searchQuery, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadLeads]);

  const openLeadDrawer = React.useCallback(async (leadId: string) => {
    if (!leadId) return;
    setIsDrawerLoading(true);
    try {
      const lead = await getLeadById(leadId);
      setActiveLead(lead);
      if (lead.nextFollowUpAt) {
        try {
          const d = new Date(lead.nextFollowUpAt);
          if (!isNaN(d.getTime())) {
            setFollowUpDate(d.toISOString().slice(0, 16));
          } else {
            setFollowUpDate('');
          }
        } catch {
          setFollowUpDate('');
        }
      } else {
        setFollowUpDate('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load lead details.';
      toast.error('Error', msg);
    } finally {
      setIsDrawerLoading(false);
    }
  }, [toast]);

  // Load specific lead if query param present
  React.useEffect(() => {
    if (initialId && isAuthenticated) {
      openLeadDrawer(initialId);
    }
  }, [initialId, isAuthenticated, openLeadDrawer]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!activeLead) return;
    const leadId = activeLead._id || activeLead.id!;
    setIsActionPending(true);
    try {
      await updateLeadStatus(leadId, newStatus);
      const updated = await getLeadById(leadId);
      setActiveLead(updated);
      toast.success('Status Updated', `Lead moved to ${newStatus}`);
      loadLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update lead status.';
      toast.error('Update Failed', msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const handlePriorityChange = async (newPriority: LeadPriority) => {
    if (!activeLead) return;
    const leadId = activeLead._id || activeLead.id!;
    setIsActionPending(true);
    try {
      await updateLeadPriority(leadId, newPriority);
      const updated = await getLeadById(leadId);
      setActiveLead(updated);
      toast.success('Priority Updated', `Priority set to ${newPriority}`);
      loadLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update lead priority.';
      toast.error('Update Failed', msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !noteInput.trim()) return;
    const leadId = activeLead._id || activeLead.id!;
    setIsActionPending(true);
    try {
      await addLeadNote(leadId, noteInput.trim());
      const updated = await getLeadById(leadId);
      setActiveLead(updated);
      setNoteInput('');
      toast.success('Note Added', 'Internal note logged to lead timeline.');
      loadLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save note.';
      toast.error('Failed to Add Note', msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleSetFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !followUpDate) return;
    const leadId = activeLead._id || activeLead.id!;
    setIsActionPending(true);
    try {
      await setLeadFollowUp(
        leadId,
        new Date(followUpDate).toISOString(),
        followUpNote.trim() || undefined,
      );
      const updated = await getLeadById(leadId);
      setActiveLead(updated);
      setFollowUpNote('');
      toast.success('Follow-up Scheduled', 'Follow-up date recorded.');
      loadLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not schedule follow-up.';
      toast.error('Follow-up Error', msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    if (!activeLead) return;
    const leadId = activeLead._id || activeLead.id!;
    setIsActionPending(true);
    try {
      await completeFollowUp(leadId, followUpId, 'Completed by agent');
      const updated = await getLeadById(leadId);
      setActiveLead(updated);
      toast.success('Follow-up Completed', 'Marked follow-up as completed.');
      loadLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete follow-up.';
      toast.error('Action Failed', msg);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancelFollowUp = async (followUpId: string) => {
    if (!activeLead) return;
    const leadId = activeLead._id || activeLead.id!;
    setIsActionPending(true);
    try {
      await cancelFollowUp(leadId, followUpId, 'Cancelled by agent');
      const updated = await getLeadById(leadId);
      setActiveLead(updated);
      toast.success('Follow-up Cancelled', 'Follow-up cancelled.');
      loadLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not cancel follow-up.';
      toast.error('Action Failed', msg);
    } finally {
      setIsActionPending(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Lead CRM...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Login Required</h2>
        <p className="text-slate-600 max-w-md mb-6">
          Sign in to access your inquiries, buyer phone numbers, follow-ups, and negotiation history.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 bg-casa-600 text-white rounded-xl font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Safe property extraction helpers
  const propertyTitle = activeLead?.property?.title || activeLead?.propertyTitle || 'Listing Inquiry';
  const propertySlug = activeLead?.property?.slug || activeLead?.propertySlug;
  const propertyLocation = activeLead?.property?.location || activeLead?.propertyLocation || 'Location on request';
  const rawPrice = activeLead?.property?.price ?? activeLead?.propertyPrice;
  const propertyPriceFormatted = typeof rawPrice === 'number' ? formatPrice(rawPrice) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Buyer Leads & Inquiries</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-casa-50 text-casa-700 border border-casa-200">
              {leadsData.pagination.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inquiries automatically routed from your active published properties.
          </p>
        </div>

        <button
          onClick={loadLeads}
          className="inline-flex items-center px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Leads
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setSelectedStatus(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === tab.value
                ? 'bg-casa-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Priority Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLeads()}
            placeholder="Search by buyer name, mobile, email, or property..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <select
            value={selectedPriority || ''}
            onChange={(e) => {
              setSelectedPriority((e.target.value as LeadPriority) || undefined);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Leads Table / List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {leadsData.data.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No leads found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no inquiries matching your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leadsData.data.map((lead) => {
              const leadId = lead._id || lead.id || '';
              const leadName = lead.name || lead.contactName || 'Inquiry';
              const leadPhone = lead.mobile || lead.contactPhone || 'No phone';
              const leadEmail = lead.email || lead.contactEmail;
              const leadStatus = lead.status || 'NEW';
              const leadPriority = lead.priority || 'MEDIUM';
              const leadPropTitle = lead.propertyTitle || 'Listing Inquiry';
              return (
                <div
                  key={leadId}
                  onClick={() => openLeadDrawer(leadId)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-900 text-sm">{leadName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          leadStatus === 'NEW'
                            ? 'bg-casa-50 text-casa-700 border border-casa-200'
                            : leadStatus === 'CONVERTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : leadStatus === 'SITE_VISIT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : leadStatus === 'NEGOTIATION'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {leadStatus.replace(/_/g, ' ')}
                      </span>
                      {leadPriority === 'URGENT' || leadPriority === 'HIGH' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 uppercase">
                          {leadPriority}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-600 truncate font-medium">
                      Property: {leadPropTitle}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      &ldquo;{lead.message || lead.subject || 'Enquiry details'}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center text-slate-600 font-medium">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" /> {leadPhone}
                      </span>
                      {leadEmail && (
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" /> {leadEmail}
                        </span>
                      )}
                      <span>•</span>
                      <span>Received {formatSafeDate(lead.createdAt)}</span>
                      {lead.nextFollowUpAt && (
                        <span className="text-amber-600 font-medium flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Follow-up: {formatSafeDate(lead.nextFollowUpAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-semibold text-casa-600 hover:text-casa-700 flex items-center">
                      Manage <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {leadsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {leadsData.pagination.page} of {leadsData.pagination.totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={!leadsData.pagination.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={!leadsData.pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Drawer / Modal */}
      {(activeLead || isDrawerLoading) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            {isDrawerLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Loading lead details...</p>
              </div>
            ) : activeLead ? (
              <div className="space-y-6">
                {/* Drawer Top */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-bold text-slate-900">
                      {activeLead.name || activeLead.contactName || 'Lead Inquiry'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Lead ID: <span className="font-mono">{activeLead._id || activeLead.id}</span> • Received {formatSafeDateTime(activeLead.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveLead(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status & Priority Selectors */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Lead Status
                    </label>
                    <select
                      value={activeLead.status || 'NEW'}
                      disabled={isActionPending}
                      onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-casa-500"
                    >
                      <option value="NEW">New Inquiry</option>
                      <option value="CONTACTED">Contacted Buyer</option>
                      <option value="FOLLOW_UP">Follow Up Scheduled</option>
                      <option value="QUALIFIED">Qualified Lead</option>
                      <option value="INTERESTED">Interested Buyer</option>
                      <option value="SITE_VISIT">Site Visit Scheduled</option>
                      <option value="NEGOTIATION">Under Negotiation</option>
                      <option value="CONVERTED">Deal Converted 🎉</option>
                      <option value="LOST">Lost Opportunity</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="CLOSED">Closed Lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Priority Level
                    </label>
                    <select
                      value={activeLead.priority || 'MEDIUM'}
                      disabled={isActionPending}
                      onChange={(e) => handlePriorityChange(e.target.value as LeadPriority)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-casa-500"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">🔥 Urgent Attention</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info & Property Link */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact & Property Details</h3>
                  <div className="p-4 bg-slate-50/80 rounded-xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mobile Phone:</span>
                      <a href={`tel:${activeLead.mobile || activeLead.contactPhone}`} className="font-semibold text-casa-600 hover:underline">
                        {activeLead.mobile || activeLead.contactPhone || 'Not provided'}
                      </a>
                    </div>
                    {(activeLead.email || activeLead.contactEmail) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email Address:</span>
                        <a href={`mailto:${activeLead.email || activeLead.contactEmail}`} className="font-semibold text-casa-600 hover:underline">
                          {activeLead.email || activeLead.contactEmail}
                        </a>
                      </div>
                    )}
                    {activeLead.preferredLocation && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Preferred Location:</span>
                        <span className="font-medium text-slate-800">{activeLead.preferredLocation}</span>
                      </div>
                    )}
                    {activeLead.budget && (activeLead.budget.min || activeLead.budget.max) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Budget Range:</span>
                        <span className="font-medium text-slate-800">
                          {activeLead.budget.min ? formatPrice(activeLead.budget.min) : '₹0'} - {activeLead.budget.max ? formatPrice(activeLead.budget.max) : 'Max'}
                        </span>
                      </div>
                    )}
                    {activeLead.source && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Source:</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200/70 text-slate-700">
                          {activeLead.source}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0">Property:</span>
                        <div className="text-right">
                          <Link
                            href={propertySlug ? `/property/${propertySlug}` : '#'}
                            target={propertySlug ? '_blank' : undefined}
                            className="font-semibold text-slate-900 hover:text-casa-600 flex items-center justify-end"
                          >
                            <span className="truncate max-w-[260px]">{propertyTitle}</span>
                            {propertySlug && <ExternalLink className="w-3 h-3 ml-1 text-slate-400 shrink-0" />}
                          </Link>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {propertyLocation}{propertyPriceFormatted ? ` • ${propertyPriceFormatted}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Customer Message:</span>
                      <p className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed">
                        &ldquo;{activeLead.message || activeLead.subject || 'No initial message text.'}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Follow-up Scheduling */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Schedule & Follow-ups
                  </h3>

                  {/* Scheduled follow-ups list */}
                  {(activeLead.followUps && activeLead.followUps.length > 0) && (
                    <div className="space-y-2 mb-3">
                      {activeLead.followUps.map((fu, idx) => (
                        <div
                          key={fu._id || idx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                            fu.status === 'COMPLETED'
                              ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
                              : fu.status === 'CANCELLED'
                              ? 'bg-slate-50 border-slate-200 text-slate-500 line-through'
                              : 'bg-amber-50/60 border-amber-200 text-amber-900'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border">
                                {fu.type || 'CALL'}
                              </span>
                              <span className="font-semibold">{formatSafeDateTime(fu.dueAt)}</span>
                              <span className="text-[10px] font-bold">({fu.status})</span>
                            </div>
                            {fu.note && <p className="text-xs text-slate-700 truncate">{fu.note}</p>}
                          </div>

                          {fu.status === 'PENDING' && fu._id && (
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() => handleCompleteFollowUp(fu._id!)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold flex items-center"
                                title="Mark Completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() => handleCancelFollowUp(fu._id!)}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center"
                                title="Cancel Follow-up"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSetFollowUp} className="space-y-3 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Next Follow-up Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Follow-up Note / Objective</label>
                        <input
                          type="text"
                          value={followUpNote}
                          onChange={(e) => setFollowUpNote(e.target.value)}
                          placeholder="e.g. Call for site visit confirmation"
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isActionPending || !followUpDate}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                      >
                        Schedule Follow-up
                      </button>
                    </div>
                  </form>
                </div>

                {/* Internal Notes History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" /> Internal Notes
                  </h3>
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Log a client conversation note..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-500"
                    />
                    <button
                      type="submit"
                      disabled={isActionPending || !noteInput.trim()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shrink-0 disabled:opacity-50"
                    >
                      Add Note
                    </button>
                  </form>

                  {(!activeLead.notes || activeLead.notes.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No internal notes recorded yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeLead.notes.map((noteItem, idx) => {
                        const noteText = typeof noteItem === 'string' ? noteItem : noteItem?.text || '';
                        const author = typeof noteItem === 'object' && noteItem?.authorName ? noteItem.authorName : null;
                        const dateStr = typeof noteItem === 'object' && noteItem?.createdAt ? formatSafeDateTime(noteItem.createdAt) : null;
                        return (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100 space-y-1">
                            <p className="font-medium text-slate-800 leading-relaxed">{noteText}</p>
                            {(author || dateStr) && (
                              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                                {author && <span>By {author}</span>}
                                {dateStr && <span>{dateStr}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Activity Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-casa-600" /> CRM Activity Timeline
                  </h3>

                  {(!activeLead.activities || activeLead.activities.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No activity timeline logged yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {activeLead.activities.map((act, idx) => (
                        <div key={act._id || idx} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-casa-700 text-[10px] uppercase px-1.5 py-0.5 bg-casa-50 rounded border border-casa-200">
                              {act.type}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatSafeDateTime(act.createdAt)}</span>
                          </div>
                          <p className="text-slate-800 font-medium">{act.note}</p>
                          {act.actorName && (
                            <span className="text-[10px] text-slate-400 block">
                              by {act.actorName} {act.actorRole ? `(${act.actorRole})` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Close Drawer Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveLead(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

