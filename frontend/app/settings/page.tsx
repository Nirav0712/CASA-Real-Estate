'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { SUPPORTED_LOCALES, Locale } from '@/lib/translations';
import {
  Sun,
  Moon,
  Laptop,
  Globe,
  Check,
  ChevronLeft,
  Sliders,
  Shield,
  Bell,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { locale, setLocale, t, direction, isRtl } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  const [whatsappAlerts, setWhatsappAlerts] = React.useState(true);
  const [emailAlerts, setEmailAlerts] = React.useState(true);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-casa-canvas py-8 sm:py-12 transition-colors">
      <Container>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Breadcrumb / Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-casa-text-muted hover:text-casa-brand transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('home')}</span>
            </Link>

            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full animate-in fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Preferences Saved</span>
              </span>
            )}
          </div>

          {/* Page Header */}
          <div className="space-y-2 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-casa-brand/10 text-casa-brand text-xs font-bold">
              <Sliders className="w-3.5 h-3.5" />
              <span>System Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-casa-text-primary tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-sm text-casa-text-muted">
              Customize your display theme, preferred language, regional layouts, and notification settings.
            </p>
          </div>

          {/* Theme Settings Card */}
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 text-start">
            <div className="flex items-center gap-3 border-b border-casa-border-light pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-5 h-5 text-sky-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-casa-text-primary">Interface Theme</h2>
                <p className="text-xs text-casa-text-muted">
                  Choose how MyProperty looks on your current device
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-casa-brand bg-casa-brand/5 ring-2 ring-casa-brand/20 font-bold text-casa-text-primary shadow-xs'
                    : 'border-casa-border-light bg-casa-canvas/50 hover:bg-casa-subtle text-casa-text-secondary hover:text-casa-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-semibold">Light</div>
                    <div className="text-[11px] text-casa-text-muted">Clean bright interface</div>
                  </div>
                </div>
                {theme === 'light' && <Check className="w-4 h-4 text-casa-brand" />}
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-casa-brand bg-casa-brand/5 ring-2 ring-casa-brand/20 font-bold text-casa-text-primary shadow-xs'
                    : 'border-casa-border-light bg-casa-canvas/50 hover:bg-casa-subtle text-casa-text-secondary hover:text-casa-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-sm font-semibold">Dark</div>
                    <div className="text-[11px] text-casa-text-muted">Sleek low-light mode</div>
                  </div>
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 text-casa-brand" />}
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'border-casa-brand bg-casa-brand/5 ring-2 ring-casa-brand/20 font-bold text-casa-text-primary shadow-xs'
                    : 'border-casa-border-light bg-casa-canvas/50 hover:bg-casa-subtle text-casa-text-secondary hover:text-casa-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-sm font-semibold">System</div>
                    <div className="text-[11px] text-casa-text-muted">Follow OS preference</div>
                  </div>
                </div>
                {theme === 'system' && <Check className="w-4 h-4 text-casa-brand" />}
              </button>
            </div>
          </div>

          {/* Language & Regional Settings Card */}
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 text-start">
            <div className="flex items-center gap-3 border-b border-casa-border-light pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-casa-brand" />
              </div>
              <div>
                <h2 className="text-base font-bold text-casa-text-primary">Language & Localization</h2>
                <p className="text-xs text-casa-text-muted">
                  Choose your language across navigation, property categories, and system notifications
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((locKey) => {
                const config = SUPPORTED_LOCALES[locKey];
                const isSelected = locale === locKey;

                return (
                  <button
                    key={locKey}
                    type="button"
                    onClick={() => handleLocaleChange(locKey)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-casa-brand bg-casa-brand/5 ring-2 ring-casa-brand/20 font-bold text-casa-text-primary shadow-xs'
                        : 'border-casa-border-light bg-casa-canvas/50 hover:bg-casa-subtle text-casa-text-secondary hover:text-casa-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{config.flag}</span>
                      <div>
                        <div className="text-sm font-bold text-casa-text-primary flex items-center gap-1.5">
                          <span>{config.nativeName}</span>
                          {locKey === 'gu' && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 font-extrabold">
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-casa-text-muted">
                          {config.name} ({config.direction.toUpperCase()})
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-casa-brand" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-casa-canvas/70 border border-casa-border-light text-xs text-casa-text-muted flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-casa-brand shrink-0 mt-0.5" />
              <span>
                Language preferences are securely stored in your browser session. Right-to-left (RTL) reading layout is automatically rendered for Arabic and Urdu.
              </span>
            </div>
          </div>

          {/* Notifications & Communication Settings */}
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 text-start">
            <div className="flex items-center gap-3 border-b border-casa-border-light pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-casa-text-primary">Communication Preferences</h2>
                <p className="text-xs text-casa-text-muted">
                  Control how you receive inquiry updates, price alerts, and platform messages
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-casa-canvas/50 border border-casa-border-light">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-casa-text-primary">WhatsApp Inquiries & Alerts</div>
                  <div className="text-[11px] text-casa-text-muted">
                    Receive verified buyer leads and direct property inquiries on WhatsApp
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    whatsappAlerts ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  aria-label="Toggle WhatsApp alerts"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                      whatsappAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-casa-canvas/50 border border-casa-border-light">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-casa-text-primary">Email Digest & Market Reports</div>
                  <div className="text-[11px] text-casa-text-muted">
                    Periodic market intelligence, price trend alerts, and verified listing recommendations
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    emailAlerts ? 'bg-casa-brand' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  aria-label="Toggle email alerts"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                      emailAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Account & Session Security */}
          <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 text-start">
            <div className="flex items-center gap-3 border-b border-casa-border-light pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-casa-text-primary">Account & Security</h2>
                <p className="text-xs text-casa-text-muted">
                  Manage your active login session and profile settings
                </p>
              </div>
            </div>

            {isAuthenticated && user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-casa-canvas/60 border border-casa-border-light">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-casa-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-casa-text-primary">
                      {user.name || 'Verified User'}
                    </div>
                    <div className="text-xs text-casa-text-muted">
                      {user.normalizedMobile || user.email || user.role}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-casa-brand text-white text-xs font-bold hover:bg-casa-brand-hover transition-colors shadow-2xs"
                  >
                    <span>Full Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logout()}
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  >
                    {t('signOut')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-casa-canvas/60 border border-casa-border-light">
                <div>
                  <div className="text-sm font-bold text-casa-text-primary">Not Logged In</div>
                  <div className="text-xs text-casa-text-muted">
                    Sign in to sync your preferences across devices and manage your property listings
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openAuthModal()}
                  className="shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('loginRegister')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
