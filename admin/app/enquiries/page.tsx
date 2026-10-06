'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  getAdminLeads,
  getAdminLeadById,
  updateAdminLeadStatus,
  updateAdminLeadPriority,
  assignAdminLead,
  addAdminLeadNote,
  getAdminLeadKPIs,
  getAdminAvailableAgents,
} from '@/services/lead-service';
import {
  LeadRecord,
  LeadStatus,
  LeadPriority,
  LeadKPIs,
} from '@/types';
import {
  MessageSquare,
  Phone,
  Clock,
  Search,
  Filter,
  Users,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  X,
  TrendingUp,
  Tag,
  Building,
  RefreshCw,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Leads', value: 'ALL' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Follow Up', value: 'FOLLOW_UP' },
  { label: 'Site Visit', value: 'SITE_VISIT' },
  { label: 'Negotiation', value: 'NEGOTIATION' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Lost / Closed', value: 'LOST' },
];

export default function EnquiriesPage() {
  const toast = useToast();

  const [leads, setLeads] = React.useState<LeadRecord[]>([]);
  const [kpis, setKpis] = React.useState<LeadKPIs | null>(null);
  const [agents, setAgents] = React.useState<Array<{ id: string; name: string; mobile: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLeads, setTotalLeads] = React.useState(0);

  // Lead Details Drawer State
  const [activeLead, setActiveLead] = React.useState<LeadRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState('');
  const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);

  // Assign Modal State
  const [assignTargetLead, setAssignTargetLead] = React.useState<LeadRecord | null>(null);
  const [selectedAgentId, setSelectedAgentId] = React.useState('');
  const [assignNote, setAssignNote] = React.useState('');
  const [isAssigning, setIsAssigning] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsRes, kpisRes, agentsRes] = await Promise.all([
        getAdminLeads({
          page,
          limit: 15,
          status: selectedStatus,
          q: searchQuery || undefined,
        }),
        getAdminLeadKPIs().catch(() => null),
        getAdminAvailableAgents().catch(() => []),
      ]);

      setLeads(leadsRes.data || []);
      setTotalPages(leadsRes.pagination?.totalPages || 1);
      setTotalLeads(leadsRes.pagination?.total || 0);
      if (kpisRes) setKpis(kpisRes);
      if (agentsRes) setAgents(agentsRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load leads';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, searchQuery, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDrawer = async (leadId: string) => {
    try {
      const fullLead = await getAdminLeadById(leadId);
      setActiveLead(fullLead);
      setIsDrawerOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load details';
      toast.error('Details Error', msg);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateAdminLeadStatus(leadId, newStatus);
      toast.success('Status Updated', `Lead moved to ${newStatus}`);
      if (activeLead && activeLead.id === leadId) {
        const updated = await getAdminLeadById(leadId);
        setActiveLead(updated);
      }
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error('Update Failed', msg);
    }
  };

  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    try {
      await updateAdminLeadPriority(leadId, newPriority);
      toast.success('Priority Updated', `Priority set to ${newPriority}`);
      if (activeLead && activeLead.id === leadId) {
        setActiveLead((prev) => prev ? { ...prev, priority: newPriority } : null);
      }
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update priority';
      toast.error('Update Failed', msg);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !noteInput.trim()) return;

    setIsSubmittingNote(true);
    try {
      await addAdminLeadNote(activeLead.id, noteInput.trim());
      toast.success('Note Added', 'Internal note logged to lead timeline.');
      setNoteInput('');
      const updated = await getAdminLeadById(activeLead.id);
      setActiveLead(updated);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add note';
      toast.error('Note Failed', msg);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetLead || !selectedAgentId) return;

    setIsAssigning(true);
    try {
      await assignAdminLead(assignTargetLead.id, selectedAgentId, assignNote.trim() || undefined);
      toast.success('Lead Assigned', 'Lead assigned to agent successfully.');
      setAssignTargetLead(null);
      setSelectedAgentId('');
      setAssignNote('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign lead';
      toast.error('Assignment Failed', msg);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Lead Management & CRM Hub
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Global purchaser enquiries, agent lead assignments, pipeline statuses, and follow-ups.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle">
            <span className="text-xs text-casa-text-muted font-medium">Total Leads</span>
            <p className="text-xl font-bold text-casa-text-primary mt-1">{kpis.totalLeads}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle">
            <span className="text-xs text-blue-600 font-medium">New Leads</span>
            <p className="text-xl font-bold text-blue-700 mt-1">{kpis.newLeads}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle">
            <span className="text-xs text-amber-600 font-medium">Active Pipeline</span>
            <p className="text-xl font-bold text-amber-700 mt-1">{kpis.activeLeads}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle">
            <span className="text-xs text-emerald-600 font-medium">Converted</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">{kpis.converted}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle">
            <span className="text-xs text-purple-600 font-medium">Follow-ups Due</span>
            <p className="text-xl font-bold text-purple-700 mt-1">{kpis.followUpsDue}</p>
          </Card>
          <Card className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle">
            <span className="text-xs text-rose-600 font-medium">Unassigned</span>
            <p className="text-xl font-bold text-rose-700 mt-1">{kpis.unassigned}</p>
          </Card>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-casa-surface p-4 rounded-xl border border-casa-border-light shadow-subtle">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-casa-brand text-white'
                  : 'text-casa-text-secondary hover:bg-casa-canvas'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lead name, phone, property..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
          />
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-casa-text-muted bg-casa-surface rounded-xl border border-casa-border-light">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-casa-brand" />
            Loading CRM Leads from MongoDB Atlas...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-casa-text-muted bg-casa-surface rounded-xl border border-casa-border-light">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-casa-text-primary">No leads found</p>
            <p className="text-xs text-casa-text-secondary mt-1">No enquiries match the current filter criteria.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <Card
              key={lead.id}
              className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle hover:border-casa-brand/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-casa-canvas border border-casa-border-light text-casa-text-secondary">
                    {lead.id.slice(-6)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      lead.status === 'NEW'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : lead.status === 'SITE_VISIT'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : lead.status === 'CONVERTED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : lead.status === 'LOST' || lead.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {lead.status}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      lead.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : lead.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lead.priority} Priority
                  </span>
                  <span className="text-xs text-casa-text-muted flex items-center gap-1 ml-auto md:ml-0">
                    <Clock className="w-3 h-3" /> {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-casa-brand" />
                    {lead.propertyTitle || 'Property Enquiry'}
                  </h3>
                  <p className="text-xs text-casa-text-secondary mt-1 bg-casa-canvas p-2.5 rounded-lg border border-casa-border-light line-clamp-2">
                    &ldquo;{lead.message}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-casa-text-secondary pt-1">
                  <span>
                    Buyer: <strong className="text-casa-text-primary">{lead.name || lead.contactName}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-casa-brand font-semibold">
                    <Phone className="w-3 h-3" /> {lead.mobile || lead.contactPhone}
                  </span>
                  <span>
                    Assigned: <strong className="text-casa-text-primary">{lead.assignedAgent?.name || 'Unassigned'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignTargetLead(lead);
                    setSelectedAgentId(lead.assignedAgentId || '');
                  }}
                  className="text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  Assign
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenDrawer(lead.id)}
                  className="text-xs"
                >
                  Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-casa-text-secondary pt-2">
          <span>Total {totalLeads} leads</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Lead Details Drawer */}
      {isDrawerOpen && activeLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-casa-surface h-full shadow-2xl overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-casa-border-light pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-casa-canvas border border-casa-border-light text-casa-text-secondary">
                  {activeLead.id}
                </span>
                <h2 className="text-lg font-bold text-casa-text-primary mt-1">
                  Lead Details: {activeLead.name || activeLead.contactName}
                </h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-casa-canvas text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-3 bg-casa-canvas p-4 rounded-xl border border-casa-border-light">
              <div>
                <label className="text-[10px] font-bold text-casa-text-muted uppercase">Status</label>
                <select
                  value={activeLead.status}
                  onChange={(e) => handleStatusChange(activeLead.id, e.target.value as LeadStatus)}
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg font-bold text-casa-text-primary"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="SITE_VISIT">SITE_VISIT</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="LOST">LOST</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-casa-text-muted uppercase">Priority</label>
                <select
                  value={activeLead.priority}
                  onChange={(e) => handlePriorityChange(activeLead.id, e.target.value as LeadPriority)}
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-casa-surface border border-casa-border-light rounded-lg font-bold text-casa-text-primary"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            {/* Buyer & Property Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-casa-surface border border-casa-border-light rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">Contact Info</h4>
                <div className="text-xs space-y-1 text-casa-text-secondary">
                  <p><strong>Name:</strong> {activeLead.name || activeLead.contactName}</p>
                  <p><strong>Phone:</strong> {activeLead.mobile || activeLead.contactPhone}</p>
                  <p><strong>Email:</strong> {activeLead.email || 'None'}</p>
                  <p><strong>Source:</strong> {activeLead.source}</p>
                </div>
              </div>

              <div className="p-4 bg-casa-surface border border-casa-border-light rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">Property Context</h4>
                <div className="text-xs space-y-1 text-casa-text-secondary">
                  <p className="font-semibold text-casa-text-primary">{activeLead.propertyTitle}</p>
                  <p><strong>Location:</strong> {activeLead.propertyLocation || 'Lucknow'}</p>
                  <p><strong>Assigned Agent:</strong> {activeLead.assignedAgent?.name || 'Unassigned'}</p>
                </div>
              </div>
            </div>

            {/* Enquiry Message */}
            <div className="p-4 bg-casa-canvas border border-casa-border-light rounded-xl">
              <h4 className="text-xs font-bold text-casa-text-muted uppercase mb-1">Purchaser Message</h4>
              <p className="text-xs text-casa-text-primary font-medium">&ldquo;{activeLead.message}&rdquo;</p>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-casa-brand" /> CRM Activity Timeline
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(activeLead.activities || []).length === 0 ? (
                  <p className="text-xs text-casa-text-muted italic">No activity recorded yet.</p>
                ) : (
                  activeLead.activities?.map((act, idx) => (
                    <div key={idx} className="p-3 bg-casa-canvas rounded-lg border border-casa-border-light text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-casa-brand">{act.type}</span>
                        <span className="text-[10px] text-casa-text-muted">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-casa-text-primary">{act.note}</p>
                      <span className="text-[10px] text-casa-text-muted block">by {act.actorName} ({act.actorRole})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Internal Note */}
            <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-casa-border-light">
              <label className="text-xs font-bold text-casa-text-primary">Add Internal Admin Note</label>
              <textarea
                rows={2}
                placeholder="Log internal note or call summary (hidden from purchaser)..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full p-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingNote || !noteInput.trim()}
                className="text-xs"
              >
                {isSubmittingNote ? 'Saving...' : 'Post Note'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Agent Modal */}
      {assignTargetLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-casa-surface border border-casa-border-light p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-casa-text-primary">Assign Lead to Agent</h3>
              <button
                onClick={() => setAssignTargetLead(null)}
                className="p-1 rounded-lg hover:bg-casa-canvas text-casa-text-muted hover:text-casa-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-casa-text-secondary">
              Assigning lead from <strong className="text-casa-text-primary">{assignTargetLead.name}</strong> for property{' '}
              <strong className="text-casa-text-primary">{assignTargetLead.propertyTitle}</strong>.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-casa-text-muted">Select Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  required
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary font-medium"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-casa-text-muted">Assignment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Territory agent for Gomti Nagar"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full mt-1 p-2 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignTargetLead(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isAssigning || !selectedAgentId}
                  className="text-xs"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
