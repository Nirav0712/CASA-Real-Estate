'use client';

import * as React from 'react';
import { Card, Button, Badge } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/contexts/toast-context';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Building2,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  getAdminKycQueue,
  approveAdminKyc,
  rejectAdminKyc,
  assignAdminUserPackage,
} from '@/services/admin-service';
import { getPackages } from '@/services/entitlements-service';
import { KycQueueItem, PackageRecord } from '@/types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BROKER_AGENCY: 'Broker Agency',
  BROKER: 'Broker',
  BROKER_AGENT: 'Broker Agent',
  DEVELOPER: 'Developer Account',
  AGENT: 'Real Estate Agent',
  PROPERTY_OWNER: 'Property Owner',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  GST_CERTIFICATE: 'GST Registration Certificate',
  UDYAM_CERTIFICATE: 'Udyam Registration Certificate',
  RERA_CERTIFICATE: 'RERA Registration Certificate',
  AADHAAR_CARD: 'Aadhaar Card (Front/Back)',
  PAN_CARD: 'PAN Card',
  PASSPORT: 'Passport',
  OTHER: 'Other Business / Identity Document',
};

export default function AdminKycPage() {
  const toast = useToast();

  const [items, setItems] = React.useState<KycQueueItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Counts
  const [counts, setCounts] = React.useState({ pending: 0, approved: 0, rejected: 0 });

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [accountTypeFilter, setAccountTypeFilter] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // Review & Preview Modal
  const [selectedUser, setSelectedUser] = React.useState<KycQueueItem | null>(null);
  const [activeDocTab, setActiveDocTab] = React.useState<'front' | 'back'>('front');
  const [adminNotes, setAdminNotes] = React.useState('');

  // Rejection Modal
  const [rejectingUser, setRejectingUser] = React.useState<KycQueueItem | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Package Assignment Modal
  const [packageModalUser, setPackageModalUser] = React.useState<KycQueueItem | null>(null);
  const [availablePackages, setAvailablePackages] = React.useState<PackageRecord[]>([]);
  const [selectedPackageId, setSelectedPackageId] = React.useState<string>('');
  const [loadingPackages, setLoadingPackages] = React.useState(false);

  // Search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadKycQueue = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminKycQueue({
        status: statusFilter,
        accountType: accountTypeFilter,
        search: debouncedSearch,
        page,
        limit: 12,
      });
      setItems(res.items || []);
      setCounts(res.counts || { pending: 0, approved: 0, rejected: 0 });
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load KYC verification queue';
      setError(msg);
      toast.error('Load Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, accountTypeFilter, debouncedSearch, page, toast]);

  React.useEffect(() => {
    loadKycQueue();
  }, [loadKycQueue]);

  // Handle Approve
  const handleApprove = async (user: KycQueueItem) => {
    try {
      setIsSubmitting(true);
      await approveAdminKyc(user.id, adminNotes);
      toast.success(
        'Account Approved',
        `KYC approved for ${user.name}. 3-day Free Trial is now active and WhatsApp confirmation sent.`,
      );
      setSelectedUser(null);
      setAdminNotes('');
      loadKycQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not approve KYC';
      toast.error('Approval Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    if (!rejectionReason.trim()) {
      toast.error('Reason Required', 'Please provide a clear rejection reason for the applicant.');
      return;
    }
    try {
      setIsSubmitting(true);
      await rejectAdminKyc(rejectingUser.id, rejectionReason.trim());
      toast.info(
        'KYC Rejected',
        `Application rejected for ${rejectingUser.name}. WhatsApp notification sent with instructions.`,
      );
      setRejectingUser(null);
      setRejectionReason('');
      setSelectedUser(null);
      loadKycQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reject KYC';
      toast.error('Rejection Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Package Modal
  const handleOpenPackageModal = async (user: KycQueueItem) => {
    setPackageModalUser(user);
    setSelectedPackageId(user.activePackage?.id || '');
    setLoadingPackages(true);
    try {
      const pkgs = await getPackages();
      setAvailablePackages(pkgs || []);
    } catch {
      toast.error('Packages Error', 'Could not fetch package list');
    } finally {
      setLoadingPackages(false);
    }
  };

  // Handle Assign Package
  const handleConfirmAssignPackage = async () => {
    if (!packageModalUser || !selectedPackageId) return;
    try {
      setIsSubmitting(true);
      await assignAdminUserPackage(packageModalUser.id, selectedPackageId);
      toast.success(
        'Package Assigned',
        `Package updated for ${packageModalUser.name}. WhatsApp notification dispatched.`,
      );
      setPackageModalUser(null);
      loadKycQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign package';
      toast.error('Package Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              KYC & Account Verification Governance
            </h1>
          </div>
          <p className="text-xs text-casa-text-muted mt-1">
            Manual verification workflow for Broker Agencies, Brokers, Agents, and Developer accounts. Approvals activate a 3-day Free Trial.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => loadKycQueue()}
          disabled={loading}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Verification Call Notice Banner (Requirement 8) */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-subtle">
        <Phone className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-sm">
            Applicant Verification Call Notice Active:
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Registered accounts are informed that they may receive a verification call from{' '}
            <strong className="font-bold underline text-amber-950 dark:text-white">
              +91 7069754589
            </strong>{' '}
            to complete their manual KYC verification. Ensure call notes are logged before approving.
          </p>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-casa-text-muted tracking-wider">
              Pending KYC
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {counts.pending}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-casa-text-muted tracking-wider">
              Approved Accounts
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {counts.approved}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-casa-text-muted tracking-wider">
              Rejected / Needs Resubmit
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {counts.rejected}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-casa-text-muted tracking-wider">
              Queue Total
            </p>
            <p className="text-2xl font-bold text-casa-text-primary mt-0.5">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-casa-brand-subtle flex items-center justify-center text-casa-brand">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-casa-subtle rounded-xl text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING', label: `Pending (${counts.pending})` },
              { id: 'APPROVED', label: `Approved (${counts.approved})` },
              { id: 'REJECTED', label: `Rejected (${counts.rejected})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? 'bg-casa-surface text-casa-brand shadow-xs font-bold'
                    : 'text-casa-text-secondary hover:text-casa-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row flex-1 max-w-md items-stretch sm:items-center gap-2 w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
              <input
                type="text"
                placeholder="Search name, phone, agency, RERA, document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-casa-surface border border-casa-border-medium rounded-xl pl-9 pr-3 py-2 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            {/* Account Type Filter */}
            <select
              value={accountTypeFilter}
              onChange={(e) => {
                setAccountTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-casa-surface border border-casa-border-medium rounded-xl px-3 py-2 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand"
            >
              <option value="ALL">All Account Roles</option>
              <option value="BROKER_AGENCY">Broker Agency</option>
              <option value="BROKER">Broker</option>
              <option value="BROKER_AGENT">Broker Agent</option>
              <option value="DEVELOPER">Developer Account</option>
              <option value="AGENT">Real Estate Agent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table / List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-casa-brand animate-spin" />
            <p className="text-xs text-casa-text-muted">Loading verification queue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3 text-rose-600">
            <ShieldAlert className="w-8 h-8 mx-auto" />
            <p className="text-xs">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadKycQueue()}>
              Try Again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 mx-auto text-casa-text-muted" />
            <p className="text-sm font-semibold text-casa-text-primary">
              No verification requests match current filters
            </p>
            <p className="text-xs text-casa-text-muted">
              Try switching status or account role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-casa-text-secondary">
              <thead className="bg-casa-subtle border-b border-casa-border-light text-[11px] font-bold uppercase text-casa-text-muted tracking-wider">
                <tr>
                  <th className="px-4 py-3">Applicant & Role</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Submitted Document</th>
                  <th className="px-4 py-3">KYC Status</th>
                  <th className="px-4 py-3">Trial / Package</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border-light">
                {items.map((user) => {
                  const roleLabel =
                    ACCOUNT_TYPE_LABELS[user.accountType] ||
                    ACCOUNT_TYPE_LABELS[user.role] ||
                    user.accountType ||
                    user.role;

                  const docTypeLabel = user.kycDocumentType
                    ? DOC_TYPE_LABELS[user.kycDocumentType] || user.kycDocumentType
                    : user.documents && user.documents.length > 0
                    ? DOC_TYPE_LABELS[user.documents[0].documentType] || user.documents[0].documentType
                    : 'Not Uploaded';

                  const hasFront = Boolean(user.kycFrontDocumentUrl || user.documents?.[0]?.frontDocumentUrl || user.documents?.[0]?.documentUrl);
                  const hasBack = Boolean(user.kycBackDocumentUrl || user.documents?.[0]?.backDocumentUrl);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-casa-subtle/50 transition-colors"
                    >
                      {/* Applicant & Role */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-casa-brand-subtle text-casa-brand font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-casa-text-primary block">
                              {user.name}
                            </span>
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-casa-subtle text-casa-brand mt-0.5">
                              {roleLabel}
                            </span>
                            {user.agencyName && (
                              <span className="block text-[10px] text-casa-text-muted mt-0.5">
                                Agency: {user.agencyName}
                              </span>
                            )}
                            {user.reraNumber && (
                              <span className="block text-[10px] text-casa-text-muted font-mono">
                                RERA: {user.reraNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-casa-text-primary font-medium">
                            <Phone className="w-3 h-3 text-casa-text-muted" />
                            <span>{user.normalizedMobile || user.mobile}</span>
                          </div>
                          {user.email && (
                            <div className="text-[11px] text-casa-text-muted truncate max-w-[160px]">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Submitted Document */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className="font-semibold text-casa-text-primary block">
                            {docTypeLabel}
                          </span>
                          {user.kycDocumentNumber && (
                            <span className="text-[10px] font-mono text-casa-text-muted block">
                              Doc #: {user.kycDocumentNumber}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {hasFront && (
                              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                                Front Uploaded
                              </span>
                            )}
                            {hasBack && (
                              <span className="text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                                Back Uploaded
                              </span>
                            )}
                            {!hasFront && !hasBack && (
                              <span className="text-[9px] text-casa-text-muted italic">
                                No files attached
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* KYC Status */}
                      <td className="px-4 py-3.5">
                        {user.kycStatus === 'APPROVED' ? (
                          <div className="space-y-0.5">
                            <Badge variant="active" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                              APPROVED
                            </Badge>
                            {user.kycApprovedAt && (
                              <span className="block text-[10px] text-casa-text-muted">
                                {new Date(user.kycApprovedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : user.kycStatus === 'REJECTED' ? (
                          <div className="space-y-0.5">
                            <Badge variant="rejected" size="sm" icon={<XCircle className="w-3 h-3" />}>
                              REJECTED
                            </Badge>
                            {user.kycRejectionReason && (
                              <span
                                className="block text-[10px] text-rose-600 truncate max-w-[140px]"
                                title={user.kycRejectionReason}
                              >
                                {user.kycRejectionReason}
                              </span>
                            )}
                          </div>
                        ) : user.kycStatus === 'PENDING' ? (
                          <Badge variant="pending" size="sm" icon={<Clock className="w-3 h-3" />}>
                            PENDING REVIEW
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            NOT SUBMITTED
                          </Badge>
                        )}
                      </td>

                      {/* Trial / Package */}
                      <td className="px-4 py-3.5">
                        {user.isTrialActive ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <Sparkles className="w-3 h-3 text-emerald-500" />
                              3-Day Trial Active
                            </span>
                            {user.trialExpiresAt && (
                              <span className="block text-[10px] text-casa-text-muted">
                                Expires: {new Date(user.trialExpiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : user.activePackage ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-casa-brand block">
                              {user.activePackage.name}
                            </span>
                            <span className="text-[9px] text-casa-text-muted uppercase">
                              {user.activePackage.planType}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-casa-text-muted italic">
                            No Active Entitlement
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Review & Preview Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            icon={<Eye className="w-3 h-3" />}
                            onClick={() => {
                              setSelectedUser(user);
                              setActiveDocTab('front');
                              setAdminNotes('');
                            }}
                          >
                            Preview
                          </Button>

                          {/* Quick Approve (if pending) */}
                          {user.kycStatus === 'PENDING' && (
                            <Button
                              variant="success"
                              size="xs"
                              icon={<CheckCircle2 className="w-3 h-3" />}
                              onClick={() => handleApprove(user)}
                              disabled={isSubmitting}
                            >
                              Approve
                            </Button>
                          )}

                          {/* Quick Reject (if pending) */}
                          {user.kycStatus === 'PENDING' && (
                            <Button
                              variant="danger"
                              size="xs"
                              icon={<XCircle className="w-3 h-3" />}
                              onClick={() => {
                                setRejectingUser(user);
                                setRejectionReason('');
                              }}
                              disabled={isSubmitting}
                            >
                              Reject
                            </Button>
                          )}

                          {/* Manage Package Button */}
                          <Button
                            variant="secondary"
                            size="xs"
                            icon={<Package className="w-3 h-3" />}
                            title="Assign or Change Package"
                            onClick={() => handleOpenPackageModal(user)}
                          >
                            Package
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-casa-border-light flex items-center justify-between text-xs text-casa-text-secondary">
            <span>
              Page {page} of {totalPages} ({totalCount} total applicants)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Review & Preview Modal */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`KYC Application Review: ${selectedUser.name}`}
          size="xl"
        >
          <div className="space-y-5 text-start">
            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-casa-subtle rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-casa-text-muted uppercase font-bold block">
                  Account Type
                </span>
                <span className="font-bold text-casa-text-primary">
                  {ACCOUNT_TYPE_LABELS[selectedUser.accountType] || selectedUser.accountType}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-casa-text-muted uppercase font-bold block">
                  Mobile Number
                </span>
                <span className="font-mono text-casa-text-primary">
                  {selectedUser.normalizedMobile || selectedUser.mobile}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-casa-text-muted uppercase font-bold block">
                  Agency / Firm
                </span>
                <span className="font-semibold text-casa-text-primary">
                  {selectedUser.agencyName || 'Individual / Independent'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-casa-text-muted uppercase font-bold block">
                  RERA Registration
                </span>
                <span className="font-mono text-casa-text-primary">
                  {selectedUser.reraNumber || 'N/A'}
                </span>
              </div>
            </div>

            {/* Document Details & Front/Back Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-casa-text-primary">
                    {selectedUser.kycDocumentType
                      ? DOC_TYPE_LABELS[selectedUser.kycDocumentType] || selectedUser.kycDocumentType
                      : selectedUser.documents?.[0]?.documentType || 'Uploaded Document'}
                  </h3>
                  {selectedUser.kycDocumentNumber && (
                    <p className="text-[11px] text-casa-text-muted font-mono">
                      Certificate / Document Number: {selectedUser.kycDocumentNumber}
                    </p>
                  )}
                </div>

                {/* Front / Back Toggle */}
                <div className="flex items-center gap-1 p-1 bg-casa-subtle rounded-lg text-xs">
                  <button
                    onClick={() => setActiveDocTab('front')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeDocTab === 'front'
                        ? 'bg-casa-surface text-casa-brand shadow-2xs'
                        : 'text-casa-text-secondary'
                    }`}
                  >
                    Front Side
                  </button>
                  <button
                    onClick={() => setActiveDocTab('back')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeDocTab === 'back'
                        ? 'bg-casa-surface text-casa-brand shadow-2xs'
                        : 'text-casa-text-secondary'
                    }`}
                  >
                    Back Side
                  </button>
                </div>
              </div>

              {/* Document Image / PDF Preview Container */}
              {(() => {
                const frontUrl =
                  selectedUser.kycFrontDocumentUrl ||
                  selectedUser.documents?.[0]?.frontDocumentUrl ||
                  selectedUser.documents?.[0]?.documentUrl;
                const backUrl =
                  selectedUser.kycBackDocumentUrl ||
                  selectedUser.documents?.[0]?.backDocumentUrl;

                const currentUrl = activeDocTab === 'front' ? frontUrl : backUrl;

                if (!currentUrl) {
                  return (
                    <div className="h-64 border-2 border-dashed border-casa-border-medium rounded-2xl flex flex-col items-center justify-center p-6 text-center text-casa-text-muted space-y-2 bg-casa-canvas">
                      <FileText className="w-10 h-10 stroke-1" />
                      <p className="text-xs">
                        No {activeDocTab} document file uploaded for this verification.
                      </p>
                    </div>
                  );
                }

                const isPdf = currentUrl.toLowerCase().includes('.pdf');

                return (
                  <div className="space-y-2">
                    <div className="relative border border-casa-border-light rounded-2xl overflow-hidden bg-casa-canvas h-80 flex items-center justify-center">
                      {isPdf ? (
                        <div className="p-6 text-center space-y-3">
                          <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                          <p className="text-xs font-semibold text-casa-text-primary">
                            PDF Document Attached
                          </p>
                          <a
                            href={currentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-casa-brand text-white text-xs font-semibold shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open PDF in Secure Viewer
                          </a>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentUrl}
                          alt={`${activeDocTab} verification document`}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-casa-brand font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open original file in new tab
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Admin Audit & Status Notes */}
            {selectedUser.kycStatus === 'APPROVED' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-0.5">
                <span className="font-bold block">Application is Approved</span>
                <span>
                  Approved by {selectedUser.kycApprovedBy || 'Admin'} on{' '}
                  {selectedUser.kycApprovedAt ? new Date(selectedUser.kycApprovedAt).toLocaleString() : 'N/A'}.
                  3-day Free Trial is active.
                </span>
              </div>
            )}

            {selectedUser.kycStatus === 'REJECTED' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-0.5">
                <span className="font-bold block">Application Rejected</span>
                <span>Reason: {selectedUser.kycRejectionReason || 'No reason specified'}</span>
              </div>
            )}

            {/* Approval Notes Input (if still pending) */}
            {selectedUser.kycStatus === 'PENDING' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-casa-text-muted">
                  Internal Governance / Call Verification Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified via call on +91 7069754589, GSTIN verified on government portal"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-casa-surface border border-casa-border-medium rounded-xl px-3 py-2 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-casa-border-light">
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Close Preview
              </Button>

              <div className="flex items-center gap-2">
                {selectedUser.kycStatus === 'PENDING' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setRejectingUser(selectedUser);
                        setRejectionReason('');
                      }}
                      disabled={isSubmitting}
                    >
                      Reject Application
                    </Button>

                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => handleApprove(selectedUser)}
                      disabled={isSubmitting}
                    >
                      Approve & Activate 3-Day Trial
                    </Button>
                  </>
                )}

                {selectedUser.kycStatus === 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Package className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const u = selectedUser;
                      setSelectedUser(null);
                      handleOpenPackageModal(u);
                    }}
                  >
                    Change Assigned Package
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {rejectingUser && (
        <Modal
          isOpen={Boolean(rejectingUser)}
          onClose={() => setRejectingUser(null)}
          title={`Reject KYC: ${rejectingUser.name}`}
          size="md"
        >
          <div className="space-y-4 text-start">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
              <span className="font-bold block">Mandatory Rejection Reason</span>
              <span>
                The reason provided here will be sent directly to the applicant via WhatsApp so they can rectify and resubmit their documents.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-casa-text-primary">
                Rejection Reason / Clarification Required *
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document image is blurred or back side is missing. Please re-upload clear front and back copies of your GST or Aadhaar."
                className="w-full bg-casa-surface border border-casa-border-medium rounded-xl p-3 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingUser(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={handleConfirmReject}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Package Assignment Modal (Requirement 7 & 9) */}
      {packageModalUser && (
        <Modal
          isOpen={Boolean(packageModalUser)}
          onClose={() => setPackageModalUser(null)}
          title={`Package Management: ${packageModalUser.name}`}
          size="md"
        >
          <div className="space-y-4 text-start">
            <p className="text-xs text-casa-text-muted">
              Manually assign or change this account&apos;s package tier. After updating, a WhatsApp notification with package validity and next steps will be dispatched.
            </p>

            {loadingPackages ? (
              <div className="p-8 text-center text-xs text-casa-text-muted">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />
                Loading package tiers...
              </div>
            ) : availablePackages.length === 0 ? (
              <div className="p-4 text-center text-xs text-casa-text-muted bg-casa-subtle rounded-xl">
                No active packages configured in Entitlements.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availablePackages.map((pkg) => {
                  const pkgId = pkg.id || pkg._id || '';
                  const isSelected = selectedPackageId === pkgId;

                  return (
                    <div
                      key={pkgId}
                      onClick={() => setSelectedPackageId(pkgId)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-casa-brand bg-casa-brand-subtle/40 ring-2 ring-casa-brand'
                          : 'border-casa-border-light hover:border-casa-border-medium bg-casa-surface'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-casa-text-primary">{pkg.name}</span>
                          <span className="text-[10px] uppercase font-semibold text-casa-text-muted">
                            ({pkg.billingPeriod || 'MONTHLY'})
                          </span>
                        </div>
                        <span className="text-[11px] text-casa-text-muted block mt-0.5">
                          Listings: {pkg.limits?.propertyListingsMax ?? 'Unlimited'} | Leads:{' '}
                          {pkg.limits?.leadsMonthly ?? 'Unlimited'}
                        </span>
                      </div>
                      <span className="font-bold text-casa-brand">
                        ₹{pkg.price?.toLocaleString() || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-casa-border-light">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPackageModalUser(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Package className="w-3.5 h-3.5" />}
                onClick={handleConfirmAssignPackage}
                disabled={isSubmitting || !selectedPackageId}
              >
                {isSubmitting ? 'Assigning...' : 'Assign Package'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
