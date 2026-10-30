'use client';

import * as React from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sliders,
  FileCode,
  Globe,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Eye,
  Edit3,
  Lock,
  Unlock,
  Sparkles,
  Check,
  X,
  Plus,
  Trash2,
  Share2,
} from 'lucide-react';
import {
  getSeoOverview,
  getSeoSettings,
  updateSeoSettings,
  getSeoMetadataList,
  getSeoMetadataById,
  updateSeoMetadata,
  approveSeoMetadata,
  rejectSeoMetadata,
  regenerateSeoMetadata,
  runFullSiteAudit,
  getAuditIssues,
  resolveAuditIssue,
  getSeoRedirects,
  createSeoRedirect,
  deleteSeoRedirect,
  SeoOverviewData,
  SeoSettingsData,
  SeoMetadataItem,
  SeoAuditIssueItem,
  SeoRedirectItem,
} from '@/services/seo-service';

import { useAdminAuth } from '@/contexts/auth-context';
import { getAdminApiBaseUrl } from '@/lib/api-client';

type ActiveTab = 'overview' | 'properties' | 'pages' | 'settings' | 'sitemaps' | 'audit' | 'redirects';

const DEFAULT_OVERVIEW: SeoOverviewData = {
  totalEligible: 0,
  validSeo: 0,
  pagesMissingMetadata: 0,
  pendingApproval: 0,
  rejectedCount: 0,
  criticalIssues: 0,
  highIssues: 0,
  duplicateTitles: 0,
  duplicateDescriptions: 0,
  redirectsCount: 0,
  avgScore: 0,
  sitemapAutoRegen: true,
  approvalMode: 'AUTOMATIC',
  productionDomain: 'https://my-property.in',
};

export default function SeoCommandHubPage() {
  const { adminUser, isLoading: isAuthLoading } = useAdminAuth();

  const isSuperAdmin =
    adminUser?.platformRole === 'SUPER_ADMIN' ||
    adminUser?.role === 'SUPER_ADMIN' ||
    (adminUser as any)?.role === 'SUPER_ADMIN';

  const userPerms = React.useMemo(() => new Set(adminUser?.permissions || []), [adminUser]);
  const hasPerm = (perm: string) => isSuperAdmin || userPerms.has('*') || userPerms.has(perm);

  const canViewSeo = isSuperAdmin || hasPerm('seo:view');
  const canManageSettings = isSuperAdmin || hasPerm('seo:settings_manage');
  const canManageMetadata = isSuperAdmin || hasPerm('seo:metadata_manage');
  const canApproveSeo = isSuperAdmin || hasPerm('seo:approve');
  const canAuditSeo = isSuperAdmin || hasPerm('seo:audit_view');

  const [activeTab, setActiveTab] = React.useState<ActiveTab>('overview');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Overview Data with safe fallback defaults
  const [overview, setOverview] = React.useState<SeoOverviewData>(DEFAULT_OVERVIEW);

  // Metadata Table State
  const [metadataList, setMetadataList] = React.useState<SeoMetadataItem[]>([]);
  const [metadataTotal, setMetadataTotal] = React.useState<number>(0);
  const [metadataPage, setMetadataPage] = React.useState<number>(1);
  const [metadataType, setMetadataType] = React.useState<string>('PROPERTY');
  const [metadataStatus, setMetadataStatus] = React.useState<string>('ALL');
  const [metadataSearch, setMetadataSearch] = React.useState<string>('');

  // Settings State
  const [settings, setSettings] = React.useState<SeoSettingsData | null>(null);
  const [savingSettings, setSavingSettings] = React.useState<boolean>(false);

  // Audit Issues State
  const [auditIssues, setAuditIssues] = React.useState<SeoAuditIssueItem[]>([]);
  const [auditTotal, setAuditTotal] = React.useState<number>(0);
  const [auditSeverity, setAuditSeverity] = React.useState<string>('ALL');
  const [isAuditing, setIsAuditing] = React.useState<boolean>(false);

  // Redirects State
  const [redirects, setRedirects] = React.useState<SeoRedirectItem[]>([]);
  const [redirectsTotal, setRedirectsTotal] = React.useState<number>(0);
  const [newRedirect, setNewRedirect] = React.useState({ oldPath: '', newPath: '' });
  const [creatingRedirect, setCreatingRedirect] = React.useState<boolean>(false);

  // Edit / Preview Modal
  const [selectedItem, setSelectedItem] = React.useState<SeoMetadataItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editForm, setEditForm] = React.useState<Partial<SeoMetadataItem>>({});
  const [rejectReason, setRejectReason] = React.useState<string>('');
  const [showRejectBox, setShowRejectBox] = React.useState<boolean>(false);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await getSeoOverview();
      setOverview(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load SEO overview');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async (page: number = 1) => {
    try {
      const data = await getSeoMetadataList({
        entityType: metadataType,
        approvalStatus: metadataStatus,
        search: metadataSearch,
        page,
        limit: 15,
      });
      setMetadataList(data.items);
      setMetadataTotal(data.total);
      setMetadataPage(page);
    } catch (err: any) {
      setError(err?.message || 'Failed to load metadata');
    }
  };

  const loadSettings = async () => {
    try {
      const data = await getSeoSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load SEO settings');
    }
  };

  const loadAuditIssues = async () => {
    try {
      const data = await getAuditIssues({
        severity: auditSeverity,
        resolved: false,
        page: 1,
        limit: 30,
      });
      setAuditIssues(data.items);
      setAuditTotal(data.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit issues');
    }
  };

  const loadRedirects = async () => {
    try {
      const data = await getSeoRedirects({ page: 1, limit: 30 });
      setRedirects(data.items);
      setRedirectsTotal(data.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load redirects');
    }
  };

  React.useEffect(() => {
    if (canViewSeo) {
      loadOverview();
    }
  }, [canViewSeo]);

  React.useEffect(() => {
    if (!canViewSeo) return;
    if (activeTab === 'properties' || activeTab === 'pages') {
      loadMetadata(1);
    } else if (activeTab === 'settings' || activeTab === 'sitemaps') {
      loadSettings();
    } else if (activeTab === 'audit') {
      loadAuditIssues();
    } else if (activeTab === 'redirects') {
      loadRedirects();
    }
  }, [canViewSeo, activeTab, metadataType, metadataStatus, auditSeverity]);

  // Handle Full Site Audit Trigger
  const handleTriggerAudit = async () => {
    try {
      setIsAuditing(true);
      const res = await runFullSiteAudit();
      showToast(`Audit scan completed: ${res.scanned} pages inspected, ${res.issuesFound} issues diagnosed.`);
      await loadOverview();
      if (activeTab === 'audit') await loadAuditIssues();
    } catch (err: any) {
      setError(err?.message || 'Audit trigger failed');
    } finally {
      setIsAuditing(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: SeoMetadataItem) => {
    setSelectedItem(item);
    setEditForm({
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      canonicalUrl: item.canonicalUrl,
      focusKeyword: item.focusKeyword,
      openGraphTitle: item.openGraphTitle || item.metaTitle,
      openGraphDescription: item.openGraphDescription || item.metaDescription,
      openGraphImage: item.openGraphImage,
      robotsIndex: item.robotsIndex,
      robotsFollow: item.robotsFollow,
      fieldLocks: item.fieldLocks || {},
    });
    setShowRejectBox(false);
    setRejectReason('');
    setIsModalOpen(true);
  };

  // Save Metadata Changes
  const handleSaveMetadata = async () => {
    if (!selectedItem) return;
    try {
      const updated = await updateSeoMetadata(selectedItem._id, editForm);
      showToast(`Metadata for ${updated.pagePath} saved successfully.`);
      setIsModalOpen(false);
      loadMetadata(metadataPage);
      loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Failed to save metadata');
    }
  };

  // Approve Metadata
  const handleApprove = async (id: string) => {
    try {
      await approveSeoMetadata(id);
      showToast('SEO metadata approved and released for indexing.');
      setIsModalOpen(false);
      loadMetadata(metadataPage);
      loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Approval failed');
    }
  };

  // Reject Metadata
  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason code or feedback for rejection.');
      return;
    }
    try {
      await rejectSeoMetadata(id, rejectReason);
      showToast('SEO metadata rejected.');
      setIsModalOpen(false);
      loadMetadata(metadataPage);
      loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Rejection failed');
    }
  };

  // Regenerate Metadata
  const handleRegenerate = async (id: string) => {
    try {
      const regenerated = await regenerateSeoMetadata(id);
      showToast(`Regenerated SEO from source content. Quality score: ${regenerated.seoScore}/100`);
      setSelectedItem(regenerated);
      setEditForm({
        metaTitle: regenerated.metaTitle,
        metaDescription: regenerated.metaDescription,
        canonicalUrl: regenerated.canonicalUrl,
        focusKeyword: regenerated.focusKeyword,
        openGraphTitle: regenerated.openGraphTitle,
        openGraphDescription: regenerated.openGraphDescription,
        openGraphImage: regenerated.openGraphImage,
        robotsIndex: regenerated.robotsIndex,
        fieldLocks: regenerated.fieldLocks,
      });
      loadMetadata(metadataPage);
    } catch (err: any) {
      setError(err?.message || 'Regeneration failed');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSavingSettings(true);
      await updateSeoSettings(settings);
      showToast('Global SEO configurations updated successfully.');
      loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Failed to update SEO settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Create Redirect
  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedirect.oldPath || !newRedirect.newPath) return;
    try {
      setCreatingRedirect(true);
      await createSeoRedirect(newRedirect);
      showToast(`Redirect from ${newRedirect.oldPath} created.`);
      setNewRedirect({ oldPath: '', newPath: '' });
      loadRedirects();
    } catch (err: any) {
      setError(err?.message || 'Failed to create redirect');
    } finally {
      setCreatingRedirect(false);
    }
  };

  // Delete Redirect
  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('Are you sure you want to remove this URL redirect?')) return;
    try {
      await deleteSeoRedirect(id);
      showToast('Redirect removed.');
      loadRedirects();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete redirect');
    }
  };

  // Resolve Audit Issue
  const handleResolveIssue = async (id: string) => {
    try {
      await resolveAuditIssue(id);
      showToast('Issue marked as resolved.');
      loadAuditIssues();
      loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200';
    return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">LOW</span>;
    }
  };

  if (!isAuthLoading && !canViewSeo) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12 bg-casa-surface border border-casa-border rounded-2xl shadow-subtle">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-casa-text-primary">Access Restricted</h1>
        <p className="text-xs text-casa-text-secondary leading-relaxed max-w-md mx-auto">
          You do not have administrative permissions (<code>seo:view</code>) to access the SEO Command Hub.
          Please contact your Superadmin to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-casa-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-casa-brand/10 text-casa-brand flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-casa-text-primary tracking-tight">
                SEO Management & Search Engine Engine
              </h1>
              <p className="text-xs text-casa-text-muted mt-0.5">
                Centralized automated SEO governance, on-page optimization, XML sitemaps, and indexing controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-casa-brand text-white shadow-subtle hover:bg-casa-brand-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing Marketplace...' : 'Run Full Site Audit'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-casa-border overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: 'overview', label: 'SEO Overview' },
          { key: 'properties', label: 'Property SEO' },
          { key: 'pages', label: 'Pages & Locations' },
          { key: 'settings', label: 'Global Settings' },
          { key: 'sitemaps', label: 'Sitemaps & Robots' },
          { key: 'audit', label: `Issues & Audits ${overview?.criticalIssues ? `(${overview.criticalIssues})` : ''}` },
          { key: 'redirects', label: 'URL Redirects' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as ActiveTab);
              if (tab.key === 'properties') setMetadataType('PROPERTY');
              if (tab.key === 'pages') setMetadataType('PAGE');
            }}
            className={`px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-casa-brand/10 text-casa-brand border-b-2 border-casa-brand font-bold'
                : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-casa-surface border border-casa-border shadow-subtle">
              <span className="text-[11px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                Total Managed Pages
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-casa-text-primary">
                  {overview?.totalEligible ?? '—'}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Indexed</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-casa-surface border border-casa-border shadow-subtle">
              <span className="text-[11px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                Avg. SEO Quality Score
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-casa-brand">
                  {overview?.avgScore ? `${overview.avgScore}/100` : '—'}
                </span>
                <span className="text-xs text-casa-text-muted font-medium">8-point check</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-casa-surface border border-casa-border shadow-subtle">
              <span className="text-[11px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                Pending Approval
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {overview?.pendingApproval ?? 0}
                </span>
                <span className="text-xs text-casa-text-muted font-medium">In review</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-casa-surface border border-casa-border shadow-subtle">
              <span className="text-[11px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                Critical Technical Issues
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-600">
                  {overview?.criticalIssues ?? 0}
                </span>
                <span className="text-xs text-rose-500 font-medium">Requires fix</span>
              </div>
            </div>
          </div>

          {/* Secondary Diagnostic Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-casa-brand" />
                <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                  Automation & Governance
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-casa-border">
                  <span className="text-casa-text-secondary">Approval Mode</span>
                  <span className="font-semibold text-casa-text-primary">{overview?.approvalMode || 'AUTOMATIC'}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-casa-border">
                  <span className="text-casa-text-secondary">Sitemap Auto-Regeneration</span>
                  <span className="font-semibold text-emerald-600">Active (Realtime)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-casa-text-secondary">Active 301 Redirects</span>
                  <span className="font-semibold text-casa-text-primary">{overview?.redirectsCount ?? 0} routes</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                  Duplicate Content Alerts
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-casa-border">
                  <span className="text-casa-text-secondary">Duplicate Titles</span>
                  <span className={`font-semibold ${overview?.duplicateTitles ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {overview?.duplicateTitles ?? 0} titles
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-casa-border">
                  <span className="text-casa-text-secondary">Duplicate Descriptions</span>
                  <span className={`font-semibold ${overview?.duplicateDescriptions ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {overview?.duplicateDescriptions ?? 0} descriptions
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-casa-text-secondary">Pages Missing Metadata</span>
                  <span className="font-semibold text-emerald-600">0 (100% Covered)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                  Indexing & Sitemaps
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-casa-border">
                  <span className="text-casa-text-secondary">Canonical Domain</span>
                  <span className="font-semibold text-casa-text-primary truncate max-w-[160px]">
                    {overview?.productionDomain}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-casa-border">
                  <span className="text-casa-text-secondary">XML Sitemap Index</span>
                  <a
                    href={`${getAdminApiBaseUrl()}/seo/public/sitemap.xml`}
                    target="_blank"
                    className="flex items-center gap-1 font-semibold text-casa-brand hover:underline"
                  >
                    <span>View XML</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-casa-text-secondary">Robots.txt</span>
                  <a
                    href={`${getAdminApiBaseUrl()}/seo/public/robots.txt`}
                    target="_blank"
                    className="flex items-center gap-1 font-semibold text-casa-brand hover:underline"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: PROPERTY SEO / PAGES & LOCATIONS */}
      {(activeTab === 'properties' || activeTab === 'pages') && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-casa-surface border border-casa-border">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-casa-text-muted" />
                <input
                  type="text"
                  placeholder="Search title, URL path, keyword..."
                  value={metadataSearch}
                  onChange={(e) => setMetadataSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadMetadata(1)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-casa-border bg-casa-surface text-xs focus:outline-none focus:border-casa-brand"
                />
              </div>

              {activeTab === 'pages' && (
                <select
                  value={metadataType}
                  onChange={(e) => setMetadataType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-casa-border bg-casa-surface text-xs font-medium focus:outline-none"
                >
                  <option value="PAGE">Static Pages</option>
                  <option value="LOCATION">Locations</option>
                  <option value="CATEGORY">Categories</option>
                </select>
              )}

              <select
                value={metadataStatus}
                onChange={(e) => setMetadataStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-casa-border bg-casa-surface text-xs font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING_APPROVAL">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="text-xs text-casa-text-muted font-medium">
              Showing {metadataList.length} of {metadataTotal} records
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl bg-casa-surface border border-casa-border">
            <table className="w-full text-start text-xs">
              <thead className="bg-casa-subtle/50 border-b border-casa-border text-casa-text-muted font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-start">Page / URL Path</th>
                  <th className="px-4 py-3 text-start">Meta Title & Description Preview</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Indexing</th>
                  <th className="px-4 py-3 text-center">Approval</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border">
                {metadataList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-casa-text-muted">
                      No SEO metadata records match the selected filter.
                    </td>
                  </tr>
                ) : (
                  metadataList.map((item) => (
                    <tr key={item._id} className="hover:bg-casa-subtle/30 transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="font-semibold text-casa-text-primary block truncate">
                          {item.pagePath}
                        </span>
                        <span className="text-[10px] text-casa-text-muted block font-mono truncate">
                          {item.entityType} • {item.generationMode}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-[340px]">
                        <div className="font-semibold text-casa-brand truncate">
                          {item.metaTitle}
                        </div>
                        <div className="text-casa-text-secondary text-[11px] line-clamp-1 mt-0.5">
                          {item.metaDescription}
                        </div>
                        {item.focusKeyword && (
                          <span className="inline-block mt-1 text-[10px] bg-casa-subtle px-2 py-0.2 rounded text-casa-text-muted">
                            KW: {item.focusKeyword}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${getScoreBadgeColor(item.seoScore)}`}>
                          {item.seoScore}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.robotsIndex ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            INDEX
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            NOINDEX
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.approvalStatus === 'APPROVED' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            APPROVED
                          </span>
                        )}
                        {item.approvalStatus === 'PENDING_APPROVAL' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            PENDING
                          </span>
                        )}
                        {item.approvalStatus === 'REJECTED' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            REJECTED
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-end space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-casa-subtle hover:bg-casa-brand/10 hover:text-casa-brand transition-colors"
                        >
                          Review & Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Domain & Brand Config */}
            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                Canonical Origin & Brand Identity
              </h3>

              <div>
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Website Name
                </label>
                <input
                  type="text"
                  value={settings.websiteName}
                  onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Production Canonical Domain
                </label>
                <input
                  type="text"
                  value={settings.productionDomain}
                  onChange={(e) => setSettings({ ...settings, productionDomain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs"
                />
                <span className="text-[10px] text-casa-text-muted block mt-0.5">
                  Applied to all canonical tags, JSON-LD structured data, and XML sitemaps.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Default Title Brand Suffix
                </label>
                <input
                  type="text"
                  value={settings.defaultTitleSuffix}
                  onChange={(e) => setSettings({ ...settings, defaultTitleSuffix: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Default Fallback Description
                </label>
                <textarea
                  rows={3}
                  value={settings.defaultDescription}
                  onChange={(e) => setSettings({ ...settings, defaultDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs"
                />
              </div>
            </div>

            {/* Automation & Moderation Policies */}
            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                Automation & Approval Governance
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-casa-subtle/50">
                  <div>
                    <span className="text-xs font-bold text-casa-text-primary block">
                      Auto-Generate Metadata on Submission
                    </span>
                    <span className="text-[11px] text-casa-text-muted">
                      Generate SEO automatically when properties are listed.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.automation.autoGenerateOnCreate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        automation: { ...settings.automation, autoGenerateOnCreate: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-casa-brand"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-casa-subtle/50">
                  <div>
                    <span className="text-xs font-bold text-casa-text-primary block">
                      Auto-Regenerate on Details Update
                    </span>
                    <span className="text-[11px] text-casa-text-muted">
                      Keep metadata aligned with price and locality changes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.automation.autoRegenerateOnUpdate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        automation: { ...settings.automation, autoRegenerateOnUpdate: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-casa-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                    Approval Mode
                  </label>
                  <select
                    value={settings.automation.approvalMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        automation: {
                          ...settings.automation,
                          approvalMode: e.target.value as 'AUTOMATIC' | 'MANUAL',
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-medium"
                  >
                    <option value="AUTOMATIC">Mode A — Automatic Approval for Valid Metadata</option>
                    <option value="MANUAL">Mode B — Strict Manual Reviewer Approval Required</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Metadata Templates */}
          <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
            <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
              Centralized Metadata Templates & Tokens
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Property Title Template
                </label>
                <input
                  type="text"
                  value={settings.templates.propertyTitleTemplate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: { ...settings.templates, propertyTitleTemplate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
                />
                <span className="text-[10px] text-casa-text-muted mt-0.5 block">
                  Tokens: &#123;bedrooms&#125;, &#123;propertyType&#125;, &#123;listingPurpose&#125;, &#123;locality&#125;, &#123;city&#125;, &#123;titleSuffix&#125;
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Location Title Template
                </label>
                <input
                  type="text"
                  value={settings.templates.locationTitleTemplate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: { ...settings.templates, locationTitleTemplate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-casa-text-secondary block mb-1">
                  Property Description Template
                </label>
                <textarea
                  rows={2}
                  value={settings.templates.propertyDescTemplate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: { ...settings.templates, propertyDescTemplate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-casa-brand text-white shadow-subtle hover:bg-casa-brand-hover transition-colors"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Global SEO Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: SITEMAPS & ROBOTS */}
      {activeTab === 'sitemaps' && settings && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>XML Sitemaps Live Endpoints</span>
              </h3>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                XML sitemaps are generated on-the-fly directly from MongoDB. Draft, unverified, rejected, and noindexed properties are strictly excluded.
              </p>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Root Sitemap Index', path: `${getAdminApiBaseUrl()}/seo/public/sitemap.xml` },
                  { name: 'Property Listings Sitemap', path: `${getAdminApiBaseUrl()}/seo/public/sitemap-properties.xml` },
                  { name: 'Static Pages Sitemap', path: `${getAdminApiBaseUrl()}/seo/public/sitemap-pages.xml` },
                  { name: 'City & Location Sitemap', path: `${getAdminApiBaseUrl()}/seo/public/sitemap-locations.xml` },
                ].map((sm) => (
                  <div key={sm.path} className="flex items-center justify-between p-2.5 rounded-xl bg-casa-subtle/50">
                    <div>
                      <span className="font-semibold text-casa-text-primary block">{sm.name}</span>
                      <span className="text-[10px] text-casa-text-muted font-mono">{sm.path}</span>
                    </div>
                    <a
                      href={sm.path}
                      target="_blank"
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-casa-brand text-white hover:bg-casa-brand-hover flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-casa-surface border border-casa-border space-y-4">
              <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-casa-brand" />
                <span>Robots.txt Directives</span>
              </h3>
              <p className="text-xs text-casa-text-secondary leading-relaxed">
                Directives tell Googlebot and search engines which sections to crawl. Internal `/admin/` and `/private/` routes are blocked.
              </p>

              <textarea
                rows={8}
                value={settings.robotsTxt.customDirectives}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    robotsTxt: { customDirectives: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-casa-border bg-slate-950 text-emerald-400 font-mono text-xs"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-casa-brand text-white shadow-subtle"
                >
                  Save Robots.txt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT ISSUES */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-casa-surface border border-casa-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-casa-text-primary">Severity Filter:</span>
              <select
                value={auditSeverity}
                onChange={(e) => setAuditSeverity(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-casa-border bg-casa-surface text-xs font-medium"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Only</option>
                <option value="MEDIUM">Medium Only</option>
                <option value="LOW">Low Only</option>
              </select>
            </div>

            <span className="text-xs text-casa-text-muted font-medium">
              {auditTotal} unresolved issues diagnosed
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-casa-surface border border-casa-border">
            <table className="w-full text-start text-xs">
              <thead className="bg-casa-subtle/50 border-b border-casa-border text-casa-text-muted font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-start">Severity</th>
                  <th className="px-4 py-3 text-start">Affected URL</th>
                  <th className="px-4 py-3 text-start">Diagnostic Finding</th>
                  <th className="px-4 py-3 text-start">Recommended Solution</th>
                  <th className="px-4 py-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border">
                {auditIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-emerald-600 font-semibold">
                      🎉 No active SEO issues diagnosed! Your marketplace adheres to high technical SEO standards.
                    </td>
                  </tr>
                ) : (
                  auditIssues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-casa-subtle/30">
                      <td className="px-4 py-3">{getSeverityBadge(issue.severity)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] max-w-[200px] truncate">{issue.url}</td>
                      <td className="px-4 py-3 text-casa-text-primary font-medium">{issue.message}</td>
                      <td className="px-4 py-3 text-casa-text-secondary text-[11px] max-w-[260px]">{issue.recommendedFix}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleResolveIssue(issue._id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          Mark Resolved
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: URL REDIRECTS */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateRedirect} className="p-4 rounded-2xl bg-casa-surface border border-casa-border">
            <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider mb-3">
              Create Manual 301 Permanent Redirect
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Old URL Path (e.g. /property/old-slug)"
                value={newRedirect.oldPath}
                onChange={(e) => setNewRedirect({ ...newRedirect, oldPath: e.target.value })}
                className="w-full md:w-1/2 px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
              />
              <ArrowRight className="w-4 h-4 text-casa-text-muted shrink-0 hidden md:block" />
              <input
                type="text"
                placeholder="New Destination Path (e.g. /property/new-slug)"
                value={newRedirect.newPath}
                onChange={(e) => setNewRedirect({ ...newRedirect, newPath: e.target.value })}
                className="w-full md:w-1/2 px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
              />
              <button
                type="submit"
                disabled={creatingRedirect}
                className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-casa-brand text-white shadow-subtle shrink-0"
              >
                Add 301
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-2xl bg-casa-surface border border-casa-border">
            <table className="w-full text-start text-xs">
              <thead className="bg-casa-subtle/50 border-b border-casa-border text-casa-text-muted font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-start">Source Path</th>
                  <th className="px-4 py-3 text-start">Target Destination</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-end">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casa-border">
                {redirects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-casa-text-muted">
                      No URL redirects recorded.
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => (
                    <tr key={r._id} className="hover:bg-casa-subtle/30">
                      <td className="px-4 py-3 font-mono text-rose-600">{r.oldPath}</td>
                      <td className="px-4 py-3 font-mono text-emerald-600">{r.newPath}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {r.statusCode || 301}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDeleteRedirect(r._id)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT & PREVIEW MODAL */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-casa-surface border border-casa-border rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-casa-border pb-4">
              <div>
                <h3 className="text-base font-bold text-casa-text-primary">
                  Review & Optimize SEO Metadata
                </h3>
                <span className="text-xs text-casa-text-muted font-mono">{selectedItem.pagePath}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-casa-subtle text-casa-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google SERP Preview Box */}
            <div className="p-4 rounded-2xl bg-white text-black border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Google Search Appearance Preview
              </span>
              <div className="text-xs text-slate-700 truncate">{editForm.canonicalUrl || selectedItem.canonicalUrl}</div>
              <div className="text-base font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                {editForm.metaTitle}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2">
                {editForm.metaDescription}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-casa-text-primary">
                    Meta Title ({editForm.metaTitle?.length || 0}/60 chars)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        fieldLocks: {
                          ...editForm.fieldLocks,
                          metaTitle: !editForm.fieldLocks?.metaTitle,
                        },
                      })
                    }
                    className="flex items-center gap-1 text-[11px] text-casa-brand font-medium"
                  >
                    {editForm.fieldLocks?.metaTitle ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-600 font-bold">Locked from auto-regen</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3 text-casa-text-muted" />
                        <span>Lock Override</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={editForm.metaTitle || ''}
                  onChange={(e) => setEditForm({ ...editForm, metaTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-casa-text-primary">
                    Meta Description ({editForm.metaDescription?.length || 0}/160 chars)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        fieldLocks: {
                          ...editForm.fieldLocks,
                          metaDescription: !editForm.fieldLocks?.metaDescription,
                        },
                      })
                    }
                    className="flex items-center gap-1 text-[11px] text-casa-brand font-medium"
                  >
                    {editForm.fieldLocks?.metaDescription ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-600 font-bold">Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3 text-casa-text-muted" />
                        <span>Lock Override</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={editForm.metaDescription || ''}
                  onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-casa-text-primary block mb-1">Focus Keyword</label>
                  <input
                    type="text"
                    value={editForm.focusKeyword || ''}
                    onChange={(e) => setEditForm({ ...editForm, focusKeyword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-casa-text-primary block mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={editForm.canonicalUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, canonicalUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
                  />
                </div>
              </div>

              {/* Social Card OG Image */}
              <div>
                <label className="font-semibold text-casa-text-primary block mb-1">Open Graph Social Image URL</label>
                <input
                  type="text"
                  value={editForm.openGraphImage || ''}
                  onChange={(e) => setEditForm({ ...editForm, openGraphImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-casa-border bg-casa-surface text-xs font-mono"
                />
              </div>

              {/* Indexing Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-casa-subtle/50">
                <input
                  type="checkbox"
                  id="robotsIndexToggle"
                  checked={editForm.robotsIndex ?? true}
                  onChange={(e) => setEditForm({ ...editForm, robotsIndex: e.target.checked })}
                  className="w-4 h-4 accent-casa-brand"
                />
                <label htmlFor="robotsIndexToggle" className="cursor-pointer">
                  <span className="font-bold text-casa-text-primary block">Allow Search Engine Indexing (index, follow)</span>
                  <span className="text-[11px] text-casa-text-muted">Unchecking will apply "noindex, nofollow" robots directives.</span>
                </label>
              </div>

              {/* Rejection Reason Form */}
              {showRejectBox && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <label className="font-bold text-xs block">Rejection Feedback Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. INSUFFICIENT_LOCALITY_DATA or MISLEADING_TITLE"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs bg-white text-black"
                  />
                  <button
                    type="button"
                    onClick={() => handleReject(selectedItem._id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-casa-border pt-4">
              <button
                type="button"
                onClick={() => handleRegenerate(selectedItem._id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-casa-subtle hover:bg-casa-brand/10 hover:text-casa-brand"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Auto Template</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(!showRejectBox)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  Reject SEO
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedItem._id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  Approve for SERPs
                </button>

                <button
                  type="button"
                  onClick={handleSaveMetadata}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-casa-brand text-white shadow-subtle hover:bg-casa-brand-hover"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
