'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Drawer } from '@/components/ui/drawer';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
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
} from 'lucide-react';

const ADMIN_PORTAL_URL = process.env.NEXT_ADMIN_URL || 'http://localhost:3001';

export function Header() {
  const { locale, setLocale, t, isRtl } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [isLangModalOpen, setIsLangModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-casa-surface/90 backdrop-blur-md border-b border-casa-border-light transition-colors duration-200">
        <Container>
          <div className="flex items-center justify-between h-18">
            {/* Logo & Brand Identity */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-casa-brand flex items-center justify-center text-white shadow-subtle transition-transform duration-200 group-hover:scale-105">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-start">
                <span className="text-xl font-extrabold tracking-tight text-casa-text-primary block leading-none">
                  {t('brand')}
                </span>
                <span className="text-[10px] text-casa-text-muted uppercase tracking-wider font-semibold">
                  {t('tagline')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-casa-text-secondary">
              <Link href="/" className="hover:text-casa-brand transition-colors">
                {t('home')}
              </Link>
              <Link href="/properties" className="hover:text-casa-brand text-casa-brand font-semibold transition-colors flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </Link>
              <Link href="/#featured" className="hover:text-casa-brand transition-colors">
                {t('buyProperty')}
              </Link>
              <Link href="/#latest" className="hover:text-casa-brand transition-colors">
                {t('rentLease')}
              </Link>
              <Link href="/#categories" className="hover:text-casa-brand transition-colors">
                {t('categories')}
              </Link>
              <a
                href={ADMIN_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-casa-brand hover:text-casa-brand-hover font-semibold transition-colors flex items-center gap-1"
              >
                <span>{t('adminPortal')}</span>
                <span className={isRtl ? 'rtl-flip' : ''}>↗</span>
              </a>
            </nav>

            {/* Controls: Theme, Language, Auth, Post Ad */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={`Current theme: ${theme} (${resolvedTheme})`}
                aria-label="Toggle theme mode"
                className="p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors cursor-pointer"
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
                className="p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-casa-border-light"
              >
                <Globe className="w-4 h-4 text-casa-brand" />
                <span className="uppercase">{locale}</span>
              </button>

              {/* Login / Authenticated User Profile */}
              {isAuthenticated && user ? (
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-casa-border-light hover:border-casa-brand bg-casa-surface hover:bg-casa-subtle/50 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-casa-brand text-white flex items-center justify-center text-[10px] font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-start">
                      <span className="text-xs font-semibold text-casa-text-primary block leading-none max-w-[100px] truncate">
                        {user.name || user.normalizedMobile}
                      </span>
                      <span className="text-[9px] text-casa-brand font-medium uppercase">
                        {user.isVerifiedAgent ? 'Verified Agent' : user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-casa-surface rounded-2xl shadow-elevated border border-casa-border-light py-2 z-50 animate-in fade-in slide-in-from-top-2 text-start"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-casa-border-light">
                        <span className="text-xs font-bold text-casa-text-primary block">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-casa-text-muted block">
                          {user.normalizedMobile}
                        </span>
                      </div>
                      {/* Purchaser / Buyer Section */}
                      <div className="py-1 border-b border-casa-border-light">
                        <Link
                          href="/dashboard/purchaser"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-casa-brand" />
                          <span>Buyer Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/purchaser/saved"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          <span>Saved Properties</span>
                        </Link>
                        <Link
                          href="/dashboard/purchaser/enquiries"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-casa-brand" />
                          <span>My Enquiries</span>
                        </Link>
                        <Link
                          href="/dashboard/purchaser/profile"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-casa-brand" />
                          <span>Buyer Preferences</span>
                        </Link>
                      </div>

                      {['AGENT', 'VERIFIED_AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                        <div className="py-1 border-b border-casa-border-light">
                          <Link
                            href="/dashboard/agent"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Building className="w-3.5 h-3.5 text-casa-brand" />
                            <span>Agent Dashboard</span>
                          </Link>
                          <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-casa-brand" />
                            <span>Buyer Leads</span>
                          </Link>
                          <Link
                            href="/dashboard/agent/verification"
                            className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-casa-brand" />
                            <span>RERA Verification</span>
                          </Link>
                        </div>
                      )}
                      <Link
                        href="/dashboard/properties"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle transition-colors"
                      >
                        <Home className="w-3.5 h-3.5 text-casa-brand" />
                        <span>My Properties</span>
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('signOut')}</span>
                      </button>
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

              {/* Post Free Property CTA */}
              <Link href="/#post-ad">
                <Button variant="primary" size="sm" className="shadow-sm">
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('postAd')}</span>
                  <span className="sm:hidden">{t('postAd')}</span>
                </Button>
              </Link>

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

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={t('brand')}
      >
        <div className="flex flex-col gap-6 text-start">
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
            <a
              href={ADMIN_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl bg-casa-brand-subtle text-casa-brand text-sm font-bold flex items-center justify-between mt-2"
            >
              <span>{t('adminPortal')}</span>
              <span className={isRtl ? 'rtl-flip' : ''}>↗</span>
            </a>
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
                <span className="text-xs font-bold text-casa-text-primary block">
                  {user?.name || user?.normalizedMobile}
                </span>
                <span className="text-[10px] text-casa-brand font-medium uppercase block mb-2">
                  {user?.role}
                </span>

                {/* Purchaser Workspace Mobile Links */}
                <div className="space-y-1 mb-3 pt-2 border-t border-casa-border-light">
                  <Link
                    href="/dashboard/purchaser"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-casa-brand" />
                    <span>Buyer Dashboard</span>
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
                  <Link
                    href="/dashboard/purchaser/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-casa-text-secondary hover:text-casa-text-primary rounded-lg hover:bg-casa-surface transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-casa-brand" />
                    <span>Buyer Preferences</span>
                  </Link>
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

            <Link href="/#post-ad" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" size="md" fullWidth>
                <PlusCircle className="w-4 h-4" />
                <span>{t('postAd')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
}

export function Footer() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <footer className="mt-auto bg-casa-surface border-t border-casa-border-light py-12 text-sm text-casa-text-secondary transition-colors duration-200">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10 text-start">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-casa-brand flex items-center justify-center text-white shadow-subtle">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-casa-text-primary">{t('brand')}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-casa-brand bg-casa-brand-subtle px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                Phase 05
              </span>
            </div>
            <p className="text-xs text-casa-text-muted leading-relaxed mb-4 max-w-sm">
              {t('aboutDesc')}
            </p>
            <div className="text-xs text-casa-text-muted space-y-1">
              <div>📍 Support Office: Lucknow, Uttar Pradesh, India</div>
              <div>⚡ Direct Marketplace Gateway</div>
            </div>
          </div>

          {/* Canonical Categories Sitemap */}
          <div>
            <h4 className="font-semibold text-casa-text-primary mb-3 text-xs uppercase tracking-wider">
              {t('popularCategories')}
            </h4>
            <ul className="space-y-1.5 text-xs">
              {CASA_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#categories`}
                    className="text-casa-text-muted hover:text-casa-brand transition-colors"
                  >
                    {getCategoryLabel(cat.name, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-casa-text-primary mb-3 text-xs uppercase tracking-wider">
              Land & Commercial
            </h4>
            <ul className="space-y-1.5 text-xs">
              {CASA_CATEGORIES.slice(5, 10).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#categories`}
                    className="text-casa-text-muted hover:text-casa-brand transition-colors"
                  >
                    {getCategoryLabel(cat.name, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Architecture & Multilingual */}
          <div>
            <h4 className="font-semibold text-casa-text-primary mb-3 text-xs uppercase tracking-wider">
              {t('multilingualReach')}
            </h4>
            <p className="text-xs text-casa-text-muted leading-relaxed mb-3">
              {t('multilingualDesc')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((loc) => (
                <button
                  key={loc}
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
          </div>
        </div>

        <div className="pt-6 border-t border-casa-border-light flex flex-col sm:flex-row items-center justify-between text-xs text-casa-text-muted gap-4">
          <p>© {new Date().getFullYear()} {t('brand')} Real Estate Marketplace. {t('allRightsReserved')}</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-casa-brand">{t('privacyPolicy')}</Link>
            <Link href="/" className="hover:text-casa-brand">{t('termsOfService')}</Link>
            <Link href="/" className="hover:text-casa-brand">{t('trustSafety')}</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
