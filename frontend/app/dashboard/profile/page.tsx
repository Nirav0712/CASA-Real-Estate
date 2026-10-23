'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { getMyProperties } from '@/services/property-service';
import { getPurchaserDashboard } from '@/services/purchaser-service';
import { getLeadKPIs, getMyLeads } from '@/services/lead-service';
import { getMyEntitlements, UserEntitlementResponse } from '@/services/entitlements-service';
import { Property, Lead, LeadKPIs, PurchaserDashboardData } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  LayoutDashboard,
  User as UserIcon,
  Home,
  PlusCircle,
  Video,
  Users,
  Heart,
  CreditCard,
  Receipt,
  ShieldCheck,
  Settings,
  LogOut,
  Compass,
  ExternalLink,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Shield,
  SlidersHorizontal,
  Building2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  Check,
  Layers,
  Briefcase,
  Key,
  Menu,
  X,
  Lock,
} from 'lucide-react';

const ADMIN_PORTAL_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

type TabKey = 'overview' | 'profile' | 'settings';

export default function ProfileDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';

  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    openAuthModal,
    logout,
    openPlanSelectionModal,
    openTrialExpiredModal,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
  } = useAuth();

  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();

  const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Real dashboard data states
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [leadKPIs, setLeadKPIs] = React.useState<LeadKPIs | null>(null);
  const [recentLeads, setRecentLeads] = React.useState<Lead[]>([]);
  const [purchaserData, setPurchaserData] = React.useState<PurchaserDashboardData | null>(null);
  const [entitlements, setEntitlements] = React.useState<UserEntitlementResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [dataError, setDataError] = React.useState<string | null>(null);

  // Sync tab with URL search parameter if it changes
  React.useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && ['overview', 'profile', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Role detection
  const isAdmin = Boolean(
    user && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role || user.platformRole || ''),
  );
  const isDeveloper = Boolean(
    user && (user.accountType === 'DEVELOPER' || user.role === 'DEVELOPER'),
  );
  const isBroker = Boolean(
    user &&
      (user.accountType === 'BROKER' ||
        user.accountType === 'BROKER_AGENCY' ||
        user.role === 'BROKER'),
  );
  const isAgent = Boolean(
    user &&
      (user.accountType === 'AGENT' ||
        user.accountType === 'BROKER_AGENT' ||
        user.role === 'AGENT' ||
        user.role === 'VERIFIED_AGENT'),
  );
  const isSeller = Boolean(
    user && (user.accountType === 'PROPERTY_OWNER' || user.role === 'PROPERTY_OWNER'),
  );
  const isTenant = Boolean(
    user && (user.accountType === 'TENANT' || user.role === 'TENANT'),
  );
  const isBuyer = Boolean(
    user &&
      (user.accountType === 'BUYER' ||
        user.role === 'BUYER' ||
        user.role === 'PURCHASER' ||
        (!isAdmin && !isDeveloper && !isBroker && !isAgent && !isSeller && !isTenant)),
  );
  const isSupplySide = isAgent || isBroker || isDeveloper || isSeller || isAdmin;

  // Load real data from existing APIs
  const loadDashboardData = React.useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setIsLoadingData(true);
    setDataError(null);

    try {
      if (isSupplySide) {
        const [propsRes, kpisRes, leadsRes, entRes] = await Promise.allSettled([
          getMyProperties(),
          getLeadKPIs(),
          getMyLeads({ limit: 4 }),
          getMyEntitlements(),
        ]);

        if (propsRes.status === 'fulfilled' && Array.isArray(propsRes.value)) {
          setProperties(propsRes.value);
        }
        if (kpisRes.status === 'fulfilled' && kpisRes.value) {
          setLeadKPIs(kpisRes.value);
        }
        if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
          setRecentLeads(leadsRes.value.data);
        }
        if (entRes.status === 'fulfilled' && entRes.value) {
          setEntitlements(entRes.value);
        }
      } else {
        // Buyer or Tenant
        const [purchaserRes, entRes] = await Promise.allSettled([
          getPurchaserDashboard(),
          getMyEntitlements(),
        ]);

        if (purchaserRes.status === 'fulfilled' && purchaserRes.value) {
          setPurchaserData(purchaserRes.value);
        }
        if (entRes.status === 'fulfilled' && entRes.value) {
          setEntitlements(entRes.value);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve real-time data.';
      setDataError(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, user, isSupplySide]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    } else if (!isAuthLoading) {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, user, isAuthLoading, loadDashboardData]);

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-casa-canvas py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-72 shrink-0">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
          <div className="flex-1 w-full space-y-6">
            <Skeleton className="h-32 rounded-3xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated guard: reuse existing sign-in prompts
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-casa-canvas">
        <div className="w-20 h-20 rounded-3xl bg-casa-brand-subtle text-casa-brand flex items-center justify-center mb-6 shadow-subtle">
          <UserIcon className="w-10 h-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-casa-text-primary tracking-tight mb-2">
          Sign In to Access Your Profile Dashboard
        </h1>
        <p className="text-casa-text-secondary max-w-md mb-8 text-sm leading-relaxed">
          Access your personalized overview, manage properties, review real-time client leads, and configure your account preferences.
        </p>
        <Button variant="primary" size="lg" onClick={openAuthModal} className="px-8 shadow-elevated font-bold">
          <span>Sign In or Register</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Account Type display label
  const getAccountTypeLabel = () => {
    if (isAdmin) return 'Super Administrator';
    if (isDeveloper) return 'Property Developer / Builder';
    if (isBroker) return 'Licensed Real Estate Broker';
    if (isAgent) return user.isVerifiedAgent ? 'Verified Real Estate Agent' : 'Real Estate Agent';
    if (isSeller) return 'Property Owner / Seller';
    if (isTenant) return 'Tenant (Rental User)';
    return 'Property Buyer';
  };

  const getAccountTypeBadgeColor = () => {
    if (isAdmin) return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
    if (isDeveloper) return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
    if (isBroker) return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    if (isAgent) return 'bg-casa-brand-subtle text-casa-brand border-casa-brand/20';
    if (isSeller) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    if (isTenant) return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20';
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
  };

  // Metrics calculation
  const totalPropsCount = properties.length;
  const publishedPropsCount = properties.filter(
    (p) => p.status === 'PUBLISHED' || p.status === 'APPROVED',
  ).length;
  const pendingPropsCount = properties.filter(
    (p) => p.status === 'PENDING_REVIEW' || p.status === 'PENDING_APPROVAL',
  ).length;
  const totalLeadsCount = leadKPIs?.totalLeads ?? recentLeads.length;

  const savedCount = purchaserData?.stats?.savedCount ?? 0;
  const enquiriesCount = purchaserData?.stats?.enquiriesCount ?? 0;
  const recentlyViewedCount = purchaserData?.stats?.recentlyViewedCount ?? 0;

  // Verification status
  const isKycApproved = user.isVerifiedAgent || user.kycStatus === 'APPROVED';
  const isKycPending = user.kycStatus === 'PENDING';

  return (
    <div className="min-h-screen bg-casa-canvas py-6 md:py-10 text-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center justify-between p-4 mb-4 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-casa-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-sm text-casa-text-primary block truncate">
                {user.name || user.normalizedMobile}
              </span>
              <span className="text-[10px] text-casa-brand font-semibold uppercase">
                {getAccountTypeLabel()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl border border-casa-border-light hover:bg-casa-subtle text-casa-text-primary transition-colors cursor-pointer"
            aria-label="Toggle Dashboard Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Dashboard 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* ======================================================== */}
          {/* 4.A & 4.B LEFT SIDEBAR (Width: ~270px on desktop)       */}
          {/* ======================================================== */}
          <aside
            className={`w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-24 self-start space-y-4 ${
              isMobileSidebarOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-5 shadow-subtle space-y-5">
              {/* Profile Summary Header */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-casa-border-light space-y-3">
                {/* Avatar */}
                <div className="relative">
                  {user.avatar ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-casa-border-light shadow-md">
                      <Image
                        src={user.avatar}
                        alt={user.name || 'User Avatar'}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-casa-brand to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  {isKycApproved && (
                    <div
                      className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
                      title="Verified Identity"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Name & Contact Info */}
                <div className="w-full space-y-1">
                  <h2 className="text-base font-extrabold text-casa-text-primary tracking-tight truncate">
                    {user.name || user.normalizedMobile || 'myproperty Member'}
                  </h2>
                  <p className="text-xs text-casa-text-muted flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3 text-casa-brand" />
                    <span>{user.normalizedMobile || user.mobile}</span>
                  </p>
                  {user.email && (
                    <p className="text-[11px] text-casa-text-muted truncate flex items-center justify-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.email}</span>
                    </p>
                  )}
                </div>

                {/* Account Type Badge */}
                <div className="w-full pt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase ${getAccountTypeBadgeColor()}`}
                  >
                    {getAccountTypeLabel()}
                  </span>
                </div>

                {/* Verification Badge */}
                {isKycApproved ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Account</span>
                  </div>
                ) : isKycPending ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Verification In Review</span>
                  </div>
                ) : null}

                {/* 3-Day Trial Status Card (Supply-side accounts) */}
                {isSupplySide && !isAdmin && (
                  <div className="w-full mt-2 pt-2 border-t border-casa-border-light text-start">
                    {isTrialActive ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>3-Day Trial Active</span>
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {trialDaysRemaining}d left
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={openPlanSelectionModal}
                          className="w-full text-center text-[10px] font-bold text-casa-brand hover:underline block pt-0.5"
                        >
                          View Membership Plans →
                        </button>
                      </div>
                    ) : isTrialExpired ? (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-400">
                          <PhoneCall className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                          <span>3-Day Trial Expired</span>
                        </div>
                        <button
                          type="button"
                          onClick={openTrialExpiredModal}
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] text-center shadow-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call Sales Desk</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* ==================================================== */}
              {/* 4.C ROLE-BASED SIDEBAR NAVIGATION                  */}
              {/* ==================================================== */}
              <nav className="space-y-1">
                {/* 1. Overview Tab (Default) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-casa-brand text-white shadow-sm'
                      : 'text-casa-text-primary hover:bg-casa-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      activeTab === 'overview' ? 'text-white' : 'text-casa-text-muted'
                    }`}
                  />
                </button>

                {/* 2. My Profile Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-casa-brand text-white shadow-sm'
                      : 'text-casa-text-primary hover:bg-casa-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4" />
                    <span>My Profile</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      activeTab === 'profile' ? 'text-white' : 'text-casa-text-muted'
                    }`}
                  />
                </button>

                {/* Divider */}
                <div className="py-1">
                  <div className="border-t border-casa-border-light" />
                </div>

                {/* Role Specific Actions & Direct Routes */}
                {/* A. AGENT Navigation */}
                {isAgent && (
                  <>
                    <Link
                      href="/dashboard/properties"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-casa-brand" />
                        <span>My Properties</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalPropsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/properties/new"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>Post Property</span>
                    </Link>
                    <Link
                      href="/dashboard/reels"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Video className="w-4 h-4 text-red-500" />
                      <span>My 9:16 Video Reels</span>
                    </Link>
                    <Link
                      href="/dashboard/leads"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>Client Leads & CRM</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalLeadsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/agent/verification"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>KYC & Verification</span>
                    </Link>
                  </>
                )}

                {/* B. BROKER Navigation */}
                {isBroker && (
                  <>
                    <Link
                      href="/dashboard/properties"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>Mandated Listings</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalPropsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/properties/new"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-600" />
                      <span>Post Property</span>
                    </Link>
                    <Link
                      href="/dashboard/reels"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Video className="w-4 h-4 text-red-500" />
                      <span>My 9:16 Video Reels</span>
                    </Link>
                    <Link
                      href="/dashboard/leads"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Buyer CRM</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalLeadsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/agent/verification"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Broker Verification</span>
                    </Link>
                  </>
                )}

                {/* C. DEVELOPER Navigation */}
                {isDeveloper && (
                  <>
                    <Link
                      href="/dashboard/properties"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-indigo-600" />
                        <span>Project Inventory</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalPropsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/properties/new"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-indigo-500" />
                      <span>Add Project Listing</span>
                    </Link>
                    <Link
                      href="/dashboard/leads"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Project Inquiries</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalLeadsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/kyc"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>KYC & Verification</span>
                    </Link>
                  </>
                )}

                {/* D. SELLER (Property Owner) Navigation */}
                {isSeller && (
                  <>
                    <Link
                      href="/dashboard/properties"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-emerald-600" />
                        <span>My Properties</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalPropsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/properties/new"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>Post Property</span>
                    </Link>
                    <Link
                      href="/dashboard/leads"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Buyer Inquiries</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {totalLeadsCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/kyc"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>KYC Verification</span>
                    </Link>
                  </>
                )}

                {/* E. BUYER Navigation */}
                {isBuyer && (
                  <>
                    <Link
                      href="/dashboard/purchaser/saved"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Saved Properties</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {savedCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/purchaser/enquiries"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>My Enquiries</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {enquiriesCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/purchaser/recent"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Recently Viewed</span>
                    </Link>
                    <Link
                      href="/dashboard/purchaser/profile"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-casa-brand" />
                      <span>Buyer Preferences</span>
                    </Link>
                  </>
                )}

                {/* F. TENANT Navigation */}
                {isTenant && (
                  <>
                    <Link
                      href="/dashboard/purchaser/saved"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Saved Rentals</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {savedCount}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/purchaser/enquiries"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-teal-600" />
                        <span>Rental Enquiries</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                        {enquiriesCount}
                      </span>
                    </Link>
                    <Link
                      href="/properties?listingType=RENT"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Compass className="w-4 h-4 text-teal-600" />
                      <span>Explore Rental Flats</span>
                    </Link>
                  </>
                )}

                {/* G. ADMIN / SUPER ADMIN Navigation */}
                {isAdmin && (
                  <>
                    <a
                      href={ADMIN_PORTAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4" />
                        <span>Admin Governance</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Role Command Hub</span>
                    </Link>
                    <Link
                      href="/dashboard/properties"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Home className="w-4 h-4 text-purple-600" />
                      <span>Properties Moderation</span>
                    </Link>
                  </>
                )}

                {/* Supply-side Financials: Billing & Invoices */}
                {isSupplySide && !isAdmin && (
                  <>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-casa-brand" />
                      <span>Billing & Plans</span>
                    </Link>
                    <Link
                      href="/dashboard/payments"
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-casa-text-muted" />
                      <span>Payment Invoices</span>
                    </Link>
                  </>
                )}

                {/* Divider */}
                <div className="py-1">
                  <div className="border-t border-casa-border-light" />
                </div>

                {/* 3. Account Settings Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-casa-brand text-white shadow-sm'
                      : 'text-casa-text-primary hover:bg-casa-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      activeTab === 'settings' ? 'text-white' : 'text-casa-text-muted'
                    }`}
                  />
                </button>

                {/* 4. Logout Action */}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* 4.D RIGHT-SIDE MAIN CONTENT AREA                         */}
          {/* ======================================================== */}
          <main className="flex-1 min-w-0 w-full space-y-6">
            {/* TAB 1: OVERVIEW (Default) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Heading Banner */}
                <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-casa-brand/15 via-casa-surface to-indigo-500/10 border border-casa-border-light relative overflow-hidden shadow-subtle">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-casa-brand-subtle text-casa-brand text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Dedicated Profile Dashboard</span>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-casa-text-primary tracking-tight">
                        My Dashboard
                      </h1>
                      <p className="text-xs md:text-sm text-casa-text-secondary max-w-xl leading-relaxed">
                        Welcome back, <strong className="text-casa-text-primary">{user.name || user.normalizedMobile}</strong>! Here is an up-to-date overview of your account activity, verified properties, and incoming inquiries.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {isSupplySide ? (
                        <>
                          <Link href="/dashboard/properties/new">
                            <Button variant="primary" size="md" className="shadow-subtle font-bold">
                              <PlusCircle className="w-4 h-4 mr-1.5" />
                              <span>Post Property</span>
                            </Button>
                          </Link>
                          <Link href="/dashboard/properties">
                            <Button variant="outline" size="md">
                              <Home className="w-4 h-4 mr-1.5 text-casa-brand" />
                              <span>My Properties</span>
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/properties">
                            <Button variant="primary" size="md" className="shadow-subtle font-bold">
                              <Compass className="w-4 h-4 mr-1.5" />
                              <span>Explore Listings</span>
                            </Button>
                          </Link>
                          <Link href="/dashboard/purchaser/saved">
                            <Button variant="outline" size="md">
                              <Heart className="w-4 h-4 mr-1.5 text-rose-500" />
                              <span>Saved ({savedCount})</span>
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* API Error Alert (if any non-fatal issue occurred) */}
                {dataError && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{dataError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={loadDashboardData}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Summary KPI Cards (Backed by real APIs, loading skeletons, no hardcoded stats) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {isLoadingData ? (
                    <>
                      <Skeleton className="h-28 rounded-2xl" />
                      <Skeleton className="h-28 rounded-2xl" />
                      <Skeleton className="h-28 rounded-2xl" />
                      <Skeleton className="h-28 rounded-2xl" />
                    </>
                  ) : isSupplySide ? (
                    <>
                      {/* 1. Total Properties */}
                      <Link href="/dashboard/properties" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-casa-brand transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Total Properties</span>
                            <div className="p-2 rounded-xl bg-casa-brand-subtle text-casa-brand">
                              <Building2 className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-casa-text-primary tracking-tight">
                              {totalPropsCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              {publishedPropsCount} published • {pendingPropsCount} pending
                            </p>
                          </div>
                        </Card>
                      </Link>

                      {/* 2. Published Properties */}
                      <Link href="/dashboard/properties" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-emerald-500 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Published & Live</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-emerald-600 tracking-tight">
                              {publishedPropsCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              Active in marketplace
                            </p>
                          </div>
                        </Card>
                      </Link>

                      {/* 3. Pending Approvals */}
                      <Link href="/dashboard/properties" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-amber-500 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Pending Moderation</span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-amber-600 tracking-tight">
                              {pendingPropsCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              Under admin review
                            </p>
                          </div>
                        </Card>
                      </Link>

                      {/* 4. Buyer Leads / Inquiries */}
                      <Link href="/dashboard/leads" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-indigo-500 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Client Inquiries</span>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                              <Users className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-indigo-600 tracking-tight">
                              {totalLeadsCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              Direct buyer inquiries
                            </p>
                          </div>
                        </Card>
                      </Link>
                    </>
                  ) : (
                    /* Buyer / Tenant KPI Cards */
                    <>
                      {/* 1. Saved Properties */}
                      <Link href="/dashboard/purchaser/saved" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-rose-500 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Saved Properties</span>
                            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                              <Heart className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-rose-600 tracking-tight">
                              {savedCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              Shortlisted listings
                            </p>
                          </div>
                        </Card>
                      </Link>

                      {/* 2. My Enquiries */}
                      <Link href="/dashboard/purchaser/enquiries" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-blue-500 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Active Inquiries</span>
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                              <Users className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-blue-600 tracking-tight">
                              {enquiriesCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              Responses from sellers
                            </p>
                          </div>
                        </Card>
                      </Link>

                      {/* 3. Recently Viewed */}
                      <Link href="/dashboard/purchaser/recent" className="group">
                        <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle group-hover:border-indigo-500 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-casa-text-muted">Recently Viewed</span>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-black text-indigo-600 tracking-tight">
                              {recentlyViewedCount}
                            </span>
                            <p className="text-[11px] text-casa-text-muted mt-0.5">
                              History of viewed homes
                            </p>
                          </div>
                        </Card>
                      </Link>

                      {/* 4. Verification Status */}
                      <Card className="p-5 bg-casa-surface border border-casa-border-light shadow-subtle">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-casa-text-muted">Account Status</span>
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-xl font-bold text-emerald-600 tracking-tight">
                            Active
                          </span>
                          <p className="text-[11px] text-casa-text-muted mt-0.5">
                            {user.normalizedMobile}
                          </p>
                        </div>
                      </Card>
                    </>
                  )}
                </div>

                {/* Real Data Section: Recent Properties / Inquiries */}
                {isSupplySide ? (
                  <div className="space-y-6">
                    {/* Recent Properties Grid */}
                    <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 shadow-subtle space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
                        <div>
                          <h2 className="text-base font-bold text-casa-text-primary">
                            My Recent Listings
                          </h2>
                          <p className="text-xs text-casa-text-muted mt-0.5">
                            Real-time overview of properties submitted to the marketplace
                          </p>
                        </div>
                        <Link
                          href="/dashboard/properties"
                          className="text-xs font-bold text-casa-brand hover:underline flex items-center gap-1"
                        >
                          <span>View All ({totalPropsCount})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {isLoadingData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Skeleton className="h-32 rounded-2xl" />
                          <Skeleton className="h-32 rounded-2xl" />
                        </div>
                      ) : properties.length === 0 ? (
                        <EmptyState
                          icon={<Home className="w-7 h-7 text-casa-brand" />}
                          title="No properties listed yet"
                          description="Add your first property listing to reach verified buyers and tenants across the region."
                          actionLabel="Add New Property"
                          onAction={() => router.push('/dashboard/properties/new')}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {properties.slice(0, 4).map((prop) => {
                            const title =
                              typeof prop.title === 'string'
                                ? prop.title
                                : prop.title?.en || prop.slug;
                            const price = prop.price?.amount || 0;
                            const isLive = prop.status === 'PUBLISHED' || prop.status === 'APPROVED';
                            const isPending =
                              prop.status === 'PENDING_REVIEW' || prop.status === 'PENDING_APPROVAL';

                            return (
                              <div
                                key={prop.id}
                                className="p-4 rounded-2xl border border-casa-border-light hover:border-casa-brand/50 bg-casa-canvas/50 flex flex-col justify-between space-y-3 transition-colors"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-casa-brand">
                                      {formatPrice(price)}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        isLive
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                          : isPending
                                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                          : 'bg-slate-500/10 text-slate-700 dark:text-slate-400'
                                      }`}
                                    >
                                      {prop.status}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-xs text-casa-text-primary line-clamp-1">
                                    {title}
                                  </h3>
                                  <div className="flex items-center gap-1 text-[11px] text-casa-text-muted">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {prop.location?.locality || prop.location?.city || prop.category}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-casa-border-light flex items-center justify-between">
                                  <span className="text-[10px] text-casa-text-muted font-mono">
                                    Ref: {prop.referenceId || prop.id?.slice(0, 8)}
                                  </span>
                                  <Link
                                    href={isLive ? `/property/${prop.slug}` : `/dashboard/properties/${prop.id}`}
                                    className="text-xs font-bold text-casa-brand hover:underline flex items-center gap-1"
                                  >
                                    <span>{isLive ? 'View Listing' : 'View Details'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recent Inquiries List */}
                    <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 shadow-subtle space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
                        <div>
                          <h2 className="text-base font-bold text-casa-text-primary">
                            Recent Client Inquiries
                          </h2>
                          <p className="text-xs text-casa-text-muted mt-0.5">
                            Prospective buyers and tenants who submitted inquiries on your properties
                          </p>
                        </div>
                        <Link
                          href="/dashboard/leads"
                          className="text-xs font-bold text-casa-brand hover:underline flex items-center gap-1"
                        >
                          <span>Open Leads CRM ({totalLeadsCount})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {isLoadingData ? (
                        <div className="space-y-2">
                          <Skeleton className="h-16 rounded-xl" />
                          <Skeleton className="h-16 rounded-xl" />
                        </div>
                      ) : recentLeads.length === 0 ? (
                        <EmptyState
                          icon={<Users className="w-7 h-7 text-indigo-500" />}
                          title="No inquiries received yet"
                          description="As soon as buyers and tenants express interest in your listings, their inquiries and contact details will appear here."
                        />
                      ) : (
                        <div className="space-y-2.5">
                          {recentLeads.slice(0, 4).map((lead, idx) => (
                            <div
                              key={lead.id || lead._id || idx}
                              className="p-3.5 rounded-2xl border border-casa-border-light hover:border-casa-border-medium bg-casa-canvas/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-casa-text-primary">
                                    {lead.name || 'Interested Buyer'}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-casa-brand-subtle text-casa-brand uppercase">
                                    {lead.status || 'NEW'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-casa-text-muted line-clamp-1">
                                  {lead.message || 'Expressed interest in property listing'}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {lead.mobile && (
                                  <a
                                    href={`tel:${lead.mobile}`}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{lead.mobile}</span>
                                  </a>
                                )}
                                <Link
                                  href="/dashboard/leads"
                                  className="text-xs text-casa-brand font-semibold hover:underline"
                                >
                                  Manage →
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Buyer / Tenant Recent Data Feed */
                  <div className="space-y-6">
                    {/* Saved Properties */}
                    <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 shadow-subtle space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
                        <div>
                          <h2 className="text-base font-bold text-casa-text-primary">
                            Saved Properties
                          </h2>
                          <p className="text-xs text-casa-text-muted mt-0.5">
                            Properties you shortlisted for fast access and comparison
                          </p>
                        </div>
                        <Link
                          href="/dashboard/purchaser/saved"
                          className="text-xs font-bold text-casa-brand hover:underline flex items-center gap-1"
                        >
                          <span>View All ({savedCount})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {isLoadingData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Skeleton className="h-28 rounded-2xl" />
                          <Skeleton className="h-28 rounded-2xl" />
                        </div>
                      ) : savedCount === 0 ? (
                        <EmptyState
                          icon={<Heart className="w-7 h-7 text-rose-500" />}
                          title="No saved properties yet"
                          description="Tap the heart icon on any property while exploring the marketplace to bookmark it here."
                          actionLabel="Browse Available Properties"
                          onAction={() => router.push('/properties')}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(purchaserData?.savedProperties || []).slice(0, 4).map((prop) => {
                            const title =
                              typeof prop.title === 'string'
                                ? prop.title
                                : prop.title?.en || prop.slug;
                            const price = prop.price?.amount || 0;

                            return (
                              <div
                                key={prop.id}
                                className="p-4 rounded-2xl border border-casa-border-light hover:border-rose-400 bg-casa-canvas/50 flex flex-col justify-between space-y-3 transition-colors"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-casa-brand">
                                      {formatPrice(price)}
                                    </span>
                                    <span className="text-[10px] text-casa-text-muted uppercase">
                                      {prop.listingType}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-xs text-casa-text-primary mt-1 line-clamp-1">
                                    {title}
                                  </h3>
                                  <p className="text-[11px] text-casa-text-muted mt-0.5 truncate">
                                    {prop.location?.locality || prop.location?.city}
                                  </p>
                                </div>
                                <div className="pt-2 border-t border-casa-border-light flex items-center justify-between">
                                  <Link
                                    href={`/property/${prop.slug}`}
                                    className="text-xs font-bold text-casa-brand hover:underline flex items-center gap-1"
                                  >
                                    <span>View Listing</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 md:p-8 shadow-subtle space-y-6">
                  <div className="pb-4 border-b border-casa-border-light">
                    <h2 className="text-xl font-extrabold text-casa-text-primary tracking-tight">
                      My Profile Details
                    </h2>
                    <p className="text-xs text-casa-text-secondary mt-1">
                      Review and manage your verified contact and identity information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="p-4 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-1">
                      <span className="text-[11px] font-bold text-casa-text-muted uppercase block">
                        Full Name
                      </span>
                      <span className="text-sm font-bold text-casa-text-primary block">
                        {user.name || 'Not provided'}
                      </span>
                    </div>

                    {/* Mobile Number */}
                    <div className="p-4 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-casa-text-muted uppercase">
                          Mobile Number
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified OTP
                        </span>
                      </div>
                      <span className="text-sm font-bold text-casa-text-primary block font-mono">
                        {user.normalizedMobile || user.mobile}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="p-4 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-1">
                      <span className="text-[11px] font-bold text-casa-text-muted uppercase block">
                        Email Address
                      </span>
                      <span className="text-sm font-bold text-casa-text-primary block">
                        {user.email || 'No email associated'}
                      </span>
                    </div>

                    {/* Account Type */}
                    <div className="p-4 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-1">
                      <span className="text-[11px] font-bold text-casa-text-muted uppercase block">
                        Account Type
                      </span>
                      <span className="text-sm font-bold text-casa-text-primary block">
                        {getAccountTypeLabel()}
                      </span>
                    </div>

                    {/* Agency / Company */}
                    {user.agencyName && (
                      <div className="p-4 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-1">
                        <span className="text-[11px] font-bold text-casa-text-muted uppercase block">
                          Agency / Organization
                        </span>
                        <span className="text-sm font-bold text-casa-text-primary block">
                          {user.agencyName}
                        </span>
                      </div>
                    )}

                    {/* KYC / RERA Status */}
                    <div className="p-4 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-1">
                      <span className="text-[11px] font-bold text-casa-text-muted uppercase block">
                        Identity Verification Status
                      </span>
                      <div className="flex items-center gap-2 pt-0.5">
                        {isKycApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : isKycPending ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Under Review
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-400 font-bold text-xs">
                            {user.kycStatus || 'Not Submitted'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role Specific Deep Profile Link */}
                  <div className="pt-4 border-t border-casa-border-light flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-casa-text-muted">
                      Need to update specialized broker/agent certifications, bio, or buyer property preferences?
                    </p>
                    {isAgent ? (
                      <Link href="/dashboard/agent/profile">
                        <Button variant="outline" size="sm">
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                          <span>Edit Agent Bio & Specialties</span>
                        </Button>
                      </Link>
                    ) : isBuyer ? (
                      <Link href="/dashboard/purchaser/profile">
                        <Button variant="outline" size="sm">
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                          <span>Edit Buyer Preferences</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 md:p-8 shadow-subtle space-y-6">
                  <div className="pb-4 border-b border-casa-border-light">
                    <h2 className="text-xl font-extrabold text-casa-text-primary tracking-tight">
                      Account Settings & Preferences
                    </h2>
                    <p className="text-xs text-casa-text-secondary mt-1">
                      Configure your theme, session security, and display preferences
                    </p>
                  </div>

                  {/* Theme Preference */}
                  <div className="p-5 rounded-2xl bg-casa-canvas/60 border border-casa-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-casa-text-primary">Interface Theme</h3>
                      <p className="text-xs text-casa-text-muted mt-0.5">
                        Switch between light and dark display modes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-casa-brand text-white shadow-xs'
                            : 'bg-casa-surface border border-casa-border-light text-casa-text-secondary hover:text-casa-text-primary'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-casa-brand text-white shadow-xs'
                            : 'bg-casa-surface border border-casa-border-light text-casa-text-secondary hover:text-casa-text-primary'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="p-5 rounded-2xl bg-casa-canvas/60 border border-casa-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-casa-text-primary">Preferred Language</h3>
                      <p className="text-xs text-casa-text-muted mt-0.5">
                        Select your preferred language for website navigation
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLocale('en')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          locale === 'en'
                            ? 'bg-casa-brand text-white shadow-xs'
                            : 'bg-casa-surface border border-casa-border-light text-casa-text-secondary'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocale('hi')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          locale === 'hi'
                            ? 'bg-casa-brand text-white shadow-xs'
                            : 'bg-casa-surface border border-casa-border-light text-casa-text-secondary'
                        }`}
                      >
                        हिन्दी (Hindi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocale('ar')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          locale === 'ar'
                            ? 'bg-casa-brand text-white shadow-xs'
                            : 'bg-casa-surface border border-casa-border-light text-casa-text-secondary'
                        }`}
                      >
                        العربية (Arabic)
                      </button>
                    </div>
                  </div>

                  {/* Security & Session Information */}
                  <div className="p-5 rounded-2xl bg-casa-canvas/60 border border-casa-border-light space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-casa-text-primary">
                          Session Security
                        </h3>
                        <p className="text-xs text-casa-text-muted mt-0.5">
                          Protected with HttpOnly JWT token rotation and real-time deactivation detection
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" /> Secure
                      </span>
                    </div>

                    <div className="pt-2 text-xs text-casa-text-muted flex items-center justify-between">
                      <span>Logged-in Mobile: <strong className="text-casa-text-primary">{user.normalizedMobile}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          router.push('/');
                        }}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
