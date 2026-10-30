'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Drawer } from '@/components/ui/drawer';
import { Logo } from '@/components/ui/logo';
import { GlobalLocationSelector, SelectedLocationData } from '@/components/ui/global-location-selector';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { SUPPORTED_LOCALES, Locale } from '@/lib/translations';
import { CASA_CATEGORIES, getCategoryLabel } from '@/lib/categories';
import {
  Building2,
  PlusCircle,
  Globe,
  Sun,
  Moon,
  Menu,
  Check,
  Home,
  Building,
  Layers,
  User as UserIcon,
  LogOut,
  Sparkles,
  Search,
  Users,
  ShieldCheck,
  Heart,
  MessageSquare,
  Clock,
  LayoutDashboard,
  SlidersHorizontal,
  ExternalLink,
  Shield,
  MapPin,
  PhoneCall,
  Headphones,
  CreditCard,
  Receipt,
  Video,
  ChevronDown,
  Crown,
} from 'lucide-react';
import { getPublicCompanySettings } from '@/services/entitlements-service';

const ADMIN_PORTAL_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

export function Header() {
  const router = useRouter();
  const { locale, setLocale, t, isRtl } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const {
    user,
    isAuthenticated,
    openAuthModal,
    logout,
    openPlanSelectionModal,
    openTrialExpiredModal,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    startTrial,
    hasActiveSubscription,
    activePlanName,
  } = useAuth();
  const toast = useToast();
  const [isLangModalOpen, setIsLangModalOpen] = React.useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
  const [headerLocation, setHeaderLocation] = React.useState<SelectedLocationData>({
    country: 'india',
    countryName: 'India',
    state: 'all',
    city: 'all',
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [supportPhone, setSupportPhone] = React.useState<string>('+91 70697 54589');

  React.useEffect(() => {
    let isMounted = true;
    getPublicCompanySettings()
      .then((settings) => {
        if (isMounted && settings?.customerSupportPhone) {
          setSupportPhone(settings.customerSupportPhone);
        }
      })
      .catch(() => {
        // Default initialized safely
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const dialableSupportPhone = React.useMemo(() => {
    return supportPhone.replace(/[^\d+]/g, '');
  }, [supportPhone]);

  const isAdmin = Boolean(user && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role));
  const isDeveloper = Boolean(user && user.role === 'DEVELOPER');
  const isBroker = Boolean(user && user.role === 'BROKER');
  const isAgent = Boolean(user && (user.role === 'AGENT' || user.role === 'VERIFIED_AGENT'));
  const isSeller = Boolean(user && user.role === 'PROPERTY_OWNER');
  const isTenant = Boolean(user && user.role === 'TENANT');
  const isBuyer = Boolean(
    user &&
      (user.role === 'BUYER' ||
        user.role === 'PURCHASER' ||
        (!isAdmin && !isDeveloper && !isBroker && !isAgent && !isSeller && !isTenant)),
  );

  const isBuyerOrTenant = Boolean(
    user &&
      ['BUYER', 'TENANT', 'PURCHASER'].includes(
        String(user.accountType || user.role).toUpperCase(),
      ),
  );

  const canPostProperty = Boolean(
    isAuthenticated &&
      user &&
      !isBuyerOrTenant &&
      !isAdmin &&
      [
        'AGENT',
        'BROKER',
        'BROKER_AGENCY',
        'BROKER_AGENT',
        'DEVELOPER',
        'PROPERTY_OWNER',
        'SELLER',
        'VERIFIED_AGENT',
      ].includes(String(user.accountType || user.role).toUpperCase()),
  );

  const kycStatus = String(user?.kycStatus || 'NOT_SUBMITTED').toUpperCase();
  const isKycApproved = kycStatus === 'APPROVED' || Boolean(user?.isVerifiedAgent);
  const isKycPending = kycStatus === 'PENDING';
  const isKycRejected = kycStatus === 'REJECTED';
  const isKycMissing = !isKycApproved && !isKycPending && !isKycRejected;

  const isTeamMember = Boolean(
    user &&
      (user.accountType === 'BROKER_AGENT' ||
        user.role === 'BROKER_AGENT' ||
        user.brokerId ||
        user.parentUserId),
  );

  const isFreePlanEligibleToClaim = Boolean(
    isAuthenticated &&
      user &&
      !isTeamMember &&
      !isBuyerOrTenant &&
      !isAdmin &&
      !hasActiveSubscription &&
      !user.isTrialActive &&
      !user.trialUsed &&
      isKycApproved,
  );

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-casa-surface/95 backdrop-blur-md border-b border-casa-border-light transition-colors duration-200 py-1">
        <Container>
          <div className="flex items-center justify-between min-h-[4rem] sm:min-h-[4.25rem] py-1 gap-2 sm:gap-4">
            {/* Logo & Brand Identity */}
            <div className="shrink-0 flex items-center select-none">
              <Logo size="md" height={48} href="/" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-casa-text-secondary shrink-0">
              <Link href="/" className="hover:text-casa-brand transition-colors whitespace-nowrap">
                {t('home')}
              </Link>
              <Link href="/#featured" className="hover:text-casa-brand transition-colors whitespace-nowrap">
                {t('buyProperty')}
              </Link>
              <Link href="/#latest" className="hover:text-casa-brand transition-colors whitespace-nowrap">
                {t('rentLease')}
              </Link>
              <Link href="/#categories" className="hover:text-casa-brand transition-colors whitespace-nowrap">
                {t('categories')}
              </Link>
              <Link href="/pricing" className="hover:text-casa-brand transition-colors flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pricing</span>
              </Link>
            </nav>

            {/* Controls: Support, Search, Theme, Language, Auth, Post Ad */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Call for Support Link (Desktop XL) */}
              <a
                href={`tel:${dialableSupportPhone}`}
                title={`Call for Support: ${supportPhone}`}
                aria-label={`Call for Support: ${supportPhone}`}
                className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-casa-border-light hover:border-emerald-500/50 bg-casa-surface hover:bg-emerald-500/10 dark:hover:bg-emerald-950/20 text-xs font-semibold text-casa-text-primary hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs group cursor-pointer shrink-0"
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="whitespace-nowrap">Call for Support</span>
              </a>

              {/* Call for Support Icon (Mobile / Tablet Header) */}
              <a
                href={`tel:${dialableSupportPhone}`}
                title={`Call for Support: ${supportPhone}`}
                aria-label={`Call for Support: ${supportPhone}`}
                className="xl:hidden p-2 text-casa-text-secondary hover:text-emerald-600 hover:bg-casa-subtle rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer border border-casa-border-light shrink-0"
              >
                <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </a>

              {/* Search Icon Link - Beside Theme Toggle */}
              <Link
                href="/properties"
                className="p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                title="Search Properties"
                aria-label="Search Properties"
              >
                <Search className="w-4 h-4" />
                <span className="sr-only">Search Properties</span>
              </Link>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={`Current theme: ${theme} (${resolvedTheme})`}
                aria-label="Toggle theme mode"
                className="p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-sky-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </button>

              {/* Language Switcher Button */}
              <button
                type="button"
                onClick={() => setIsLangModalOpen(true)}
                aria-label="Change language and region"
                className="p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-casa-border-light shrink-0"
              >
                <Globe className="w-4 h-4 text-casa-brand" />
                <span className="uppercase">{locale}</span>
              </button>

              {/* Login / Authenticated User Profile */}
              {isAuthenticated && user ? (
                <div className="relative hidden sm:block">
                  <div className="flex items-center rounded-xl border border-casa-border-light hover:border-casa-brand bg-casa-surface transition-colors overflow-hidden">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-casa-subtle/50 transition-colors cursor-pointer group"
                      title="Open Dedicated Profile Dashboard"
                    >
                      <div className="w-6 h-6 rounded-full bg-casa-brand text-white flex items-center justify-center text-[10px] font-bold group-hover:scale-105 transition-transform shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="text-start">
                        <span className="text-xs font-semibold text-casa-text-primary block leading-none max-w-[100px] truncate group-hover:text-casa-brand transition-colors">
                          {user.name || user.normalizedMobile}
                        </span>
                        <span className="text-[9px] text-casa-brand font-medium uppercase">
                          {user.isVerifiedAgent ? 'Verified Agent' : user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserMenuOpen(!isUserMenuOpen);
                      }}
                      className="px-2 py-2 text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle border-l border-casa-border-light cursor-pointer transition-colors"
                      title="Quick Navigation Menu"
                      aria-label="Toggle Quick Navigation Menu"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-casa-surface rounded-2xl shadow-elevated border border-casa-border-light py-2 z-50 animate-in fade-in slide-in-from-top-2 text-start"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {/* User Header Profile Link to Dedicated Dashboard */}
                      <Link
                        href="/dashboard/profile"
                        className="px-3.5 py-2.5 border-b border-casa-border-light block hover:bg-casa-subtle/60 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-casa-text-primary block truncate group-hover:text-casa-brand transition-colors">
                            {user.name || 'myproperty User'}
                          </span>
                          <span className="text-[10px] text-casa-brand font-bold">Dashboard →</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-casa-brand-subtle text-casa-brand uppercase">
                            {user.role?.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-casa-text-muted truncate">
                            {user.normalizedMobile}
                          </span>
                        </div>
                      </Link>

                      {/* Broker Team Member Indicator in Dropdown */}
                      {isTeamMember && (
                        <div className="px-3.5 py-2.5 border-b border-casa-border-light bg-blue-500/5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>Team Member Account</span>
                          </div>
                          <div className="text-[11px] text-casa-text-muted mt-0.5">
                            Team Member at {user.parentAgencyName || user.parentBrokerName || 'Broker'}
                          </div>
                        </div>
                      )}

                      {/* Trial & Membership Card in Dropdown (Supply-side accounts only - Broker only) */}
                      {!isTeamMember && !isBuyerOrTenant && !isAdmin && (
                        <div className="px-3.5 py-2 border-b border-casa-border-light bg-casa-canvas/50">
                          {hasActiveSubscription ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-500" /> {activePlanName || 'Active Plan'}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
                                  Active
                                </span>
                              </div>
                              <Link
                                href="/dashboard/billing"
                                className="text-[10px] text-casa-brand hover:underline font-semibold block text-start"
                              >
                                View billing & subscription →
                              </Link>
                            </div>
                          ) : isTrialActive ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> 3-Month Free Plan
                                </span>
                                <span className="font-mono text-casa-text-muted">{user?.trialRemainingLabel || `${trialDaysRemaining}d left`}</span>
                              </div>
                              <div className="text-[10px] text-casa-text-muted">
                                15 Property Listings Available
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsUserMenuOpen(false);
                                  router.push('/dashboard/billing');
                                }}
                                className="text-[10px] text-casa-brand hover:underline font-semibold block text-start"
                              >
                                View free plan usage & allowance →
                              </button>
                            </div>
                          ) : isTrialExpired ? (
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" /> Free Plan Expired
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsUserMenuOpen(false);
                                  router.push('/pricing');
                                }}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-extrabold text-[11px] text-center shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <span>Upgrade Subscription</span>
                              </button>
                            </div>
                          ) : isFreePlanEligibleToClaim ? (
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" /> 3-Month Free Plan Available
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsUserMenuOpen(false);
                                  router.push('/dashboard/kyc');
                                }}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] text-center shadow-sm"
                              >
                                Claim 3 Months Free (15 Listings)
                              </button>
                            </div>
                          ) : isKycPending ? (
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-500 animate-spin" /> KYC Under Review
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsUserMenuOpen(false);
                                  router.push('/dashboard/kyc');
                                }}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-[11px] text-center shadow-sm"
                              >
                                Check KYC Status
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-neutral-500" /> 3-Month Free Plan
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsUserMenuOpen(false);
                                  router.push('/dashboard/kyc');
                                }}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-[11px] text-center shadow-sm"
                              >
                                Submit KYC to Claim
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 1. Admin / Super Admin Portal Link */}
                      {isAdmin && (
                        <div className="py-1.5 border-b border-casa-border-light bg-purple-500/5">
                          <a
                            href={ADMIN_PORTAL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Admin Governance Portal</span>
                            </div>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-purple-600" />
                            <span>Role Command Hub</span>
                          </Link>
                        </div>
                      )}

                      {/* 2. Developer Workspace */}
                      {isDeveloper && (
                        <div className="py-1.5 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/developer"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Developer Console</span>
                          </Link>
                          <Link
                            href="/dashboard/properties/new"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Add Project Phase</span>
                          </Link>
                          <Link
                            href="/dashboard/properties"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Home className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Project Inventory</span>
                          </Link>
                          <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Project Inquiries</span>
                          </Link>
                        </div>
                      )}

                      {/* 3. Broker Workspace */}
                      {isBroker && (
                        <div className="py-1.5 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/broker"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Broker Workspace</span>
                          </Link>
                          <Link
                            href="/dashboard/properties"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Home className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Mandated Listings</span>
                          </Link>
                          <Link
                            href="/dashboard/reels"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Video className="w-3.5 h-3.5 text-red-500" />
                            <span>My 9:16 Video Reels</span>
                          </Link>
                          <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Buyer CRM</span>
                          </Link>
                          <Link
                            href="/dashboard/agent/verification"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Broker Verification</span>
                          </Link>
                        </div>
                      )}

                      {/* 4. Agent Workspace */}
                      {isAgent && (
                        <div className="py-1.5 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/agent"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-casa-brand hover:bg-casa-brand-subtle transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Agent Command Center</span>
                          </Link>
                          <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Buyer Leads & CRM</span>
                          </Link>
                          <Link
                            href="/dashboard/properties"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Home className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>My Listed Properties</span>
                          </Link>
                          <Link
                            href="/dashboard/reels"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Video className="w-3.5 h-3.5 text-red-500" />
                            <span>My 9:16 Video Reels</span>
                          </Link>
                          <Link
                            href="/dashboard/agent/verification"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>RERA Verification</span>
                          </Link>
                        </div>
                      )}

                      {/* 5. Seller / Property Owner Links */}
                      {isSeller && (
                        <div className="py-1.5 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/properties"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Home className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Seller Dashboard</span>
                          </Link>
                          <Link
                            href="/dashboard/properties/new"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Add New Property</span>
                          </Link>
                          <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Buyer Inquiries</span>
                          </Link>
                        </div>
                      )}

                      {/* 6. Tenant Links */}
                      {isTenant && (
                        <div className="py-1.5 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/tenant"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 transition-colors"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                            <span>Tenant Portal</span>
                          </Link>
                          <Link
                            href="/dashboard/purchaser/saved"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                            <span>Saved Rentals</span>
                          </Link>
                          <Link
                            href="/dashboard/purchaser/enquiries"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>My Enquiries</span>
                          </Link>
                        </div>
                      )}

                      {/* 7. Buyer Links */}
                      {isBuyer && (
                        <div className="py-1.5 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/purchaser"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-casa-brand hover:bg-casa-brand-subtle transition-colors"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Buyer Dashboard</span>
                          </Link>
                          <Link
                            href="/dashboard/purchaser/saved"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                            <span>Saved Properties</span>
                          </Link>
                          <Link
                            href="/dashboard/purchaser/enquiries"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>My Enquiries</span>
                          </Link>
                          <Link
                            href="/dashboard/purchaser/profile"
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-casa-text-muted" />
                            <span>Buyer Preferences</span>
                          </Link>
                        </div>
                      )}

                      <div className="py-1 border-b border-casa-border-light">
                        {!isBuyerOrTenant && !isAdmin && (
                          <>
                            <Link
                              href="/dashboard/billing"
                              className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-casa-brand" />
                              <span>Billing & Plans</span>
                            </Link>
                            <Link
                              href="/dashboard/payments"
                              className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                            >
                              <Receipt className="w-3.5 h-3.5 text-casa-text-muted" />
                              <span>Payment Invoices</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={logout}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('signOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAuthModal}
                  className="hidden sm:inline-flex"
                >
                  <UserIcon className="w-3.5 h-3.5 text-casa-brand" />
                  <span>{t('loginRegister')}</span>
                </Button>
              )}


              {/* Post Free Property CTA (Role-based: hidden for Buyer & Tenant) */}
              {canPostProperty && (
                <Link href="/dashboard/properties/new">
                  <Button variant="primary" size="sm" className="shadow-sm">
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('postAd')}</span>
                    <span className="sm:hidden">{t('postAd')}</span>
                  </Button>
                </Link>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile navigation menu"
                className="lg:hidden p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Language Selection Modal */}
      <Modal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        title="Select Language / زبان منتخب کریں"
        description="Choose your preferred language and reading direction (LTR / RTL)."
        size="sm"
      >
        <div className="grid grid-cols-1 gap-2.5">
          {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((locKey) => {
            const loc = SUPPORTED_LOCALES[locKey];
            const isSelected = locale === locKey;

            return (
              <button
                key={locKey}
                onClick={() => {
                  setLocale(locKey);
                  setIsLangModalOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-start flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'border-casa-brand bg-casa-brand-subtle text-casa-brand font-bold'
                    : 'border-casa-border-light hover:border-casa-border-medium hover:bg-casa-subtle text-casa-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{loc.flag}</span>
                  <div>
                    <span className="text-sm block leading-none font-bold">
                      {loc.nativeName}
                    </span>
                    <span className="text-xs text-casa-text-muted mt-0.5 block">
                      {loc.name} ({loc.direction.toUpperCase()})
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-casa-brand" />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Global Location Selection Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Select Global Market & Location"
      >
        <div className="space-y-5 p-1 text-start">
          <p className="text-xs text-casa-text-secondary">
            Choose a country, state or region, and verified micro-market to browse local real estate portfolios.
          </p>

          <div className="p-3 bg-casa-canvas rounded-2xl border border-casa-border-light">
            <GlobalLocationSelector
              value={headerLocation}
              onChange={(loc) => setHeaderLocation(loc)}
              variant="stacked"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLocationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsLocationModalOpen(false);
                const params = new URLSearchParams();
                if (headerLocation.country && headerLocation.country !== 'all') {
                  params.set('country', headerLocation.country);
                }
                if (headerLocation.state && headerLocation.state !== 'all') {
                  params.set('state', headerLocation.state);
                }
                if (headerLocation.city && headerLocation.city !== 'all') {
                  params.set('city', headerLocation.city);
                }
                router.push(`/properties?${params.toString()}`);
              }}
              className="flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Selected Market</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={<Logo size="sm" height={32} href="/" />}
      >
        <div className="flex flex-col gap-6 text-start">
          {/* Call for Support Link (Mobile Drawer) */}
          <a
            href={`tel:${dialableSupportPhone}`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-between transition-colors cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-none">Call for Support</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {supportPhone}
                </span>
              </div>
            </div>
            <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </a>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-casa-text-muted uppercase tracking-wider mb-2">
              Navigation
            </span>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-casa-subtle text-sm font-semibold text-casa-text-primary flex items-center gap-2.5"
            >
              <Home className="w-4 h-4 text-casa-brand" />
              <span>{t('home')}</span>
            </Link>
            <Link
              href="/properties"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-casa-subtle text-sm font-semibold text-casa-brand flex items-center gap-2.5"
            >
              <Search className="w-4 h-4 text-casa-brand" />
              <span>Search Properties</span>
            </Link>
            <Link
              href="/#featured"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-casa-subtle text-sm font-semibold text-casa-text-primary flex items-center gap-2.5"
            >
              <Building className="w-4 h-4 text-casa-brand" />
              <span>{t('buyProperty')}</span>
            </Link>
            <Link
              href="/#latest"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-casa-subtle text-sm font-semibold text-casa-text-primary flex items-center gap-2.5"
            >
              <Layers className="w-4 h-4 text-casa-brand" />
              <span>{t('rentLease')}</span>
            </Link>
            <Link
              href="/#categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-casa-subtle text-sm font-semibold text-casa-text-primary flex items-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-casa-brand" />
              <span>{t('categories')}</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-casa-border-light flex flex-col gap-3">
            {!isAuthenticated ? (
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal();
                }}
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('loginRegister')}</span>
              </Button>
            ) : (
              <div className="p-3 rounded-xl bg-casa-subtle">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 mb-2.5 p-1 -m-1 rounded-lg hover:bg-casa-surface transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-casa-brand text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-casa-text-primary block truncate group-hover:text-casa-brand transition-colors">
                      {user?.name || user?.normalizedMobile}
                    </span>
                    <span className="text-[10px] text-casa-brand font-medium uppercase block">
                      {user?.isVerifiedAgent ? 'Verified Agent' : user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </Link>

                {/* Mobile Team Member Indicator */}
                {isTeamMember && (
                  <div className="w-full mb-2.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">Team Member at {user?.parentAgencyName || user?.parentBrokerName || 'Broker'}</span>
                    </span>
                  </div>
                )}

                {/* Mobile Active Subscription Pill (Broker only) */}
                {!isTeamMember && hasActiveSubscription && !isBuyerOrTenant && !isAdmin && (
                  <Link
                    href="/dashboard/billing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full mb-2.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      {activePlanName || 'Active Plan'}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-emerald-600">Active →</span>
                  </Link>
                )}



                {/* Role-Specific Workspace Mobile Links */}
                <div className="space-y-1 mb-3 pt-2 border-t border-casa-border-light">
                  {isDeveloper && (
                    <>
                      <Link
                        href="/dashboard/developer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Developer Console</span>
                      </Link>
                      <Link
                        href="/dashboard/properties/new"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Add Project Phase</span>
                      </Link>
                      <Link
                        href="/dashboard/properties"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Home className="w-3.5 h-3.5 text-casa-text-muted" />
                        <span>Project Inventory</span>
                      </Link>
                    </>
                  )}

                  {isBroker && (
                    <>
                      <Link
                        href="/dashboard/broker"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-600 font-semibold hover:text-amber-800 rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Broker Workspace</span>
                      </Link>
                      <Link
                        href="/dashboard/properties"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Home className="w-3.5 h-3.5 text-casa-text-muted" />
                        <span>Mandated Listings</span>
                      </Link>
                      <Link
                        href="/dashboard/leads"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-casa-text-muted" />
                        <span>Buyer CRM</span>
                      </Link>
                    </>
                  )}

                  {isAgent && (
                    <>
                      <Link
                        href="/dashboard/agent"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-casa-brand" />
                        <span className="font-semibold text-casa-brand">Agent Command</span>
                      </Link>
                      <Link
                        href="/dashboard/leads"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-casa-text-muted" />
                        <span>Client Leads CRM</span>
                      </Link>
                      <Link
                        href="/dashboard/properties"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Building2 className="w-3.5 h-3.5 text-casa-brand" />
                        <span>Agent Portfolio</span>
                      </Link>
                      <Link
                        href="/dashboard/agent/verification"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>RERA Verification</span>
                      </Link>
                    </>
                  )}

                  {isSeller && (
                    <>
                      <Link
                        href="/dashboard/properties"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-emerald-700">Seller Dashboard</span>
                      </Link>
                      <Link
                        href="/dashboard/properties/new"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>List New Property</span>
                      </Link>
                      <Link
                        href="/dashboard/leads"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buyer Inquiries</span>
                      </Link>
                    </>
                  )}

                  {isTenant && (
                    <>
                      <Link
                        href="/dashboard/tenant"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-semibold text-teal-700">Tenant Portal</span>
                      </Link>
                      <Link
                        href="/dashboard/purchaser/saved"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Saved Rentals</span>
                      </Link>
                      <Link
                        href="/dashboard/purchaser/enquiries"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                        <span>Rental Enquiries</span>
                      </Link>
                    </>
                  )}

                  {isBuyer && (
                    <>
                      <Link
                        href="/dashboard/purchaser"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-casa-brand" />
                        <span className="font-semibold text-casa-brand">Buyer Dashboard</span>
                      </Link>
                      <Link
                        href="/dashboard/purchaser/saved"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Saved Properties</span>
                      </Link>
                      <Link
                        href="/dashboard/purchaser/enquiries"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-casa-brand" />
                        <span>My Enquiries</span>
                      </Link>
                      <Link
                        href="/dashboard/purchaser/recent"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-casa-brand" />
                        <span>Recently Viewed</span>
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-semibold text-purple-600">Admin Governance Hub</span>
                      </Link>
                      <a
                        href="http://localhost:3001"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-purple-600 font-semibold hover:text-purple-800 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                        <span>Open Admin Portal (:3001)</span>
                      </a>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('signOut')}</span>
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLangModalOpen(true);
              }}
            >
              <Globe className="w-4 h-4" />
              <span>{SUPPORTED_LOCALES[locale].nativeName} ({locale.toUpperCase()})</span>
            </Button>

            {canPostProperty && (
              <Link href="/dashboard/properties/new" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="md" fullWidth>
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('postAd')}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}

export function Footer() {
  const { locale, setLocale, t } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  const isBuyerOrTenant = Boolean(
    user &&
      ['BUYER', 'TENANT', 'PURCHASER'].includes(
        String(user.accountType || user.role).toUpperCase(),
      ),
  );
  const isAdmin = Boolean(
    user &&
      ['ADMIN', 'SUPER_ADMIN'].includes(
        String(user.platformRole || user.role).toUpperCase(),
      ),
  );
  const canPostProperty = Boolean(
    isAuthenticated &&
      user &&
      !isBuyerOrTenant &&
      !isAdmin &&
      [
        'AGENT',
        'BROKER',
        'BROKER_AGENCY',
        'BROKER_AGENT',
        'DEVELOPER',
        'PROPERTY_OWNER',
        'SELLER',
        'VERIFIED_AGENT',
      ].includes(String(user.accountType || user.role).toUpperCase()),
  );

  return (
    <footer className="mt-auto bg-casa-surface border-t border-casa-border-light py-12 text-sm text-casa-text-secondary transition-colors duration-200">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-start">
          {/* Brand & Mission Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Logo size="md" height={42} href="/" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-casa-brand bg-casa-brand-subtle px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                Verified
              </span>
            </div>
            <p className="text-xs text-casa-text-muted leading-relaxed max-w-sm">
              {t('aboutDesc')}
            </p>
          </div>

          {/* Real Estate Marketplace Links */}
          <div>
            <h4 className="font-semibold text-casa-text-primary mb-3 text-xs uppercase tracking-wider">
              {t('marketplaceLinks')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/properties?type=SALE"
                  className="text-casa-text-muted hover:text-casa-brand transition-colors block"
                >
                  {t('buyProperty')}
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?type=RENT"
                  className="text-casa-text-muted hover:text-casa-brand transition-colors block"
                >
                  {t('rentLease')}
                </Link>
              </li>
              {canPostProperty && (
                <li>
                  <Link
                    href="/dashboard/properties/new"
                    className="text-casa-text-muted hover:text-casa-brand transition-colors block"
                  >
                    {t('postAd')}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/properties"
                  className="text-casa-text-muted hover:text-casa-brand transition-colors block"
                >
                  {t('exploreProperties')}
                </Link>
              </li>
              <li>
                <Link
                  href="/#agents"
                  className="text-casa-text-muted hover:text-casa-brand transition-colors block"
                >
                  {t('verifiedAgents')}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-casa-text-muted hover:text-casa-brand transition-colors block font-semibold text-blue-600 dark:text-blue-400"
                >
                  Pricing & Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Canonical Categories Sitemap */}
          <div>
            <h4 className="font-semibold text-casa-text-primary mb-3 text-xs uppercase tracking-wider">
              {t('popularCategories')}
            </h4>
            <ul className="space-y-2 text-xs">
              {CASA_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href="/#categories"
                    className="text-casa-text-muted hover:text-casa-brand transition-colors block"
                  >
                    {getCategoryLabel(cat.name, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Multilingual Support & Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-casa-text-primary text-xs uppercase tracking-wider">
              {t('multilingualReach')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    locale === loc
                      ? 'bg-casa-brand text-white border-casa-brand font-bold shadow-2xs'
                      : 'bg-casa-subtle text-casa-text-secondary border-casa-border-light hover:border-casa-border-medium'
                  }`}
                >
                  {SUPPORTED_LOCALES[loc].nativeName}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-casa-border-light space-y-1.5 text-xs">
              <div>
                <Link href="/#about" className="text-casa-text-muted hover:text-casa-brand transition-colors">
                  {t('aboutUs')}
                </Link>
              </div>
              <div>
                <Link href="/#privacy" className="text-casa-text-muted hover:text-casa-brand transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </div>
              <div>
                <Link href="/#terms" className="text-casa-text-muted hover:text-casa-brand transition-colors">
                  {t('termsOfService')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-casa-border-light flex flex-col sm:flex-row items-center justify-between text-xs text-casa-text-muted gap-4">
          <p>© {new Date().getFullYear()} {t('brand')} Real Estate Marketplace. {t('allRightsReserved')}</p>
          <div className="flex gap-6">
            <Link href="/#privacy" className="hover:text-casa-brand transition-colors">{t('privacyPolicy')}</Link>
            <Link href="/#terms" className="hover:text-casa-brand transition-colors">{t('termsOfService')}</Link>
            <Link href="/#trust" className="hover:text-casa-brand transition-colors">{t('trustSafety')}</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
