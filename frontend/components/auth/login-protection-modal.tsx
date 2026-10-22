'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  X,
  LogIn,
  UserPlus,
  MessageSquare,
  Phone,
  Eye,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export function LoginProtectionModal() {
  const router = useRouter();
  const {
    isLoginProtectionOpen,
    loginProtectionIntent,
    closeLoginProtection,
    openAuthModal,
  } = useAuth();

  if (!isLoginProtectionOpen) return null;

  const intentType = loginProtectionIntent?.type || 'GENERAL';
  const propertySlug = loginProtectionIntent?.propertySlug;
  const propertyTitle = loginProtectionIntent?.propertyTitle;

  // Build the target destination URL so the user seamlessly continues after sign in / register
  let continueUrl = '/';
  if (propertySlug) {
    if (intentType === 'WHATSAPP') {
      continueUrl = `/property/${encodeURIComponent(propertySlug)}?continueAction=whatsapp`;
    } else if (intentType === 'CALL') {
      continueUrl = `/property/${encodeURIComponent(propertySlug)}?continueAction=call`;
    } else {
      continueUrl = `/property/${encodeURIComponent(propertySlug)}`;
    }
  } else if (loginProtectionIntent?.returnUrl) {
    continueUrl = loginProtectionIntent.returnUrl;
  } else if (typeof window !== 'undefined') {
    continueUrl = window.location.pathname + window.location.search;
  }

  const handleSignInRedirect = () => {
    closeLoginProtection();
    // Persist pending intent in session storage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'casa_login_intent',
          JSON.stringify({
            type: intentType,
            propertySlug,
            continueUrl,
          }),
        );
      } catch {}
    }
    router.push(`/auth/login?redirect=${encodeURIComponent(continueUrl)}`);
  };

  const handleCreateAccountRedirect = () => {
    closeLoginProtection();
    // Persist pending intent in session storage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'casa_login_intent',
          JSON.stringify({
            type: intentType,
            propertySlug,
            continueUrl,
          }),
        );
      } catch {}
    }
    router.push(`/auth/register?redirect=${encodeURIComponent(continueUrl)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-protection-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginProtection();
      }}
    >
      <div className="relative w-full max-w-md bg-casa-surface border border-casa-border-light rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
        {/* Dismiss Button */}
        <button
          onClick={closeLoginProtection}
          className="absolute top-4 right-4 p-2 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-canvas transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon with Glowing Aura */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-casa-brand/20 dark:bg-casa-brand/30 blur-md" />
          <div className="relative w-16 h-16 rounded-2xl bg-casa-brand text-white flex items-center justify-center shadow-lg">
            {intentType === 'WHATSAPP' ? (
              <MessageSquare className="w-8 h-8" />
            ) : intentType === 'CALL' ? (
              <Phone className="w-8 h-8" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Intent Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand/10 text-casa-brand text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {intentType === 'WHATSAPP'
              ? 'WhatsApp Enquiry'
              : intentType === 'CALL'
              ? 'Call Advertiser'
              : 'Verified Real Estate Access'}
          </span>
        </div>

        {/* Mandatory Requirement Title */}
        <div className="space-y-2">
          <h2
            id="login-protection-title"
            className="text-xl md:text-2xl font-extrabold text-casa-text-primary tracking-tight"
          >
            Please Sign In or Create an Account to continue.
          </h2>

          <p className="text-xs md:text-sm text-casa-text-secondary leading-relaxed">
            {intentType === 'WHATSAPP'
              ? 'To connect directly with the verified advertiser via official WhatsApp and receive instant property specifications, please sign in or register.'
              : intentType === 'CALL'
              ? "To speak directly with the verified owner or agent and view direct contact details, please sign in or register."
              : 'To view full specifications, floor plans, verified advertiser contact, and location insights, please sign in or register.'}
          </p>
        </div>

        {/* Property Reference Snippet if available */}
        {propertyTitle && (
          <div className="p-3 rounded-2xl bg-casa-canvas border border-casa-border-light text-start flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-casa-subtle flex items-center justify-center text-casa-brand shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="truncate text-xs">
              <span className="text-[10px] uppercase font-bold text-casa-text-muted block">Selected Property</span>
              <span className="font-semibold text-casa-text-primary truncate block">{propertyTitle}</span>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2 text-start text-[11px] text-casa-text-secondary pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Direct advertiser phone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Instant WhatsApp chat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Full property specs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>100% Free registration</span>
          </div>
        </div>

        {/* Two Mandatory Action Buttons: Sign In and Create Account */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSignInRedirect}
            className="text-xs md:text-sm font-bold shadow-md flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleCreateAccountRedirect}
            className="text-xs md:text-sm font-bold border-casa-brand/40 text-casa-brand hover:bg-casa-brand/5 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </Button>
        </div>

        <p className="text-[11px] text-casa-text-muted">
          Already browsing? Your selected property will open immediately after signing in.
        </p>
      </div>
    </div>
  );
}
