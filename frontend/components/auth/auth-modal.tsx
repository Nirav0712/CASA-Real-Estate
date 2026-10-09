'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, AuthModalMode } from '@/contexts/auth-context';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Send,
} from 'lucide-react';
import { UserRole } from '@/types';
import * as authService from '@/services/auth-service';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  // Mode: SIGN_IN | REGISTER | FORGOT_PASSWORD
  const [mode, setMode] = React.useState<AuthModalMode>(authModalMode || 'SIGN_IN');

  // Sign In & Registration form state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+91');
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('BUYER');
  const [agencyName, setAgencyName] = React.useState('');
  const [agreeTerms, setAgreeTerms] = React.useState(true);

  // UI state
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);
  const [forgotSubmitted, setForgotSubmitted] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resendNotice, setResendNotice] = React.useState('');

  // Sync mode with context
  React.useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset fields on modal open/close
  React.useEffect(() => {
    if (!isAuthModalOpen) {
      setErrorMsg('');
      setRegisteredEmail(null);
      setForgotSubmitted(false);
      setResendNotice('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isAuthModalOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password and confirmation password do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      const fullMobile = `${countryCode}${cleanMobile}`;
      const isProfessional = ['AGENT', 'BROKER', 'DEVELOPER'].includes(selectedRole);

      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: fullMobile,
        password,
        confirmPassword,
        role: selectedRole,
        agencyName: isProfessional ? agencyName.trim() || undefined : undefined,
      });

      setRegisteredEmail(res.email || email.trim());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setForgotSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to request password reset.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = registeredEmail || email.trim();
    if (!targetEmail || resendCooldown > 0) return;

    try {
      await authService.resendVerification({ email: targetEmail });
      setResendNotice('Verification link resent! Please check your inbox.');
      setResendCooldown(60);
    } catch {
      setResendNotice('Unable to resend at this moment. Please wait a few seconds.');
    }
  };

  const roleDescriptions: Record<string, string> = {
    BUYER: 'Explore verified properties, save favorites, compare homes, and schedule site visits.',
    TENANT: 'Search verified rental homes, book apartment walk-throughs, and chat directly with owners.',
    PROPERTY_OWNER: 'List your flat, villa, plot, or commercial space for direct sale or rent.',
    AGENT: 'List client properties, receive buyer leads, and apply for CASA RERA verification.',
    BROKER: 'Manage brokerage portfolio, commercial mandates, and verified commission deals.',
    DEVELOPER: 'Manage builder townships, project phases, digital floor plans, and direct buyer leads.',
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={
        registeredEmail
          ? 'Check Your Email'
          : mode === 'REGISTER'
          ? 'Create Your CASA Account'
          : mode === 'FORGOT_PASSWORD'
          ? 'Reset Your Password'
          : 'Welcome Back — Sign In'
      }
      description={
        registeredEmail
          ? 'An activation link has been dispatched to your email address.'
          : mode === 'REGISTER'
          ? 'Join CASA Real Estate Marketplace to buy, rent, or list properties.'
          : mode === 'FORGOT_PASSWORD'
          ? 'Enter your email address to receive password reset instructions.'
          : 'Sign in to access your saved properties, enquiries, and dashboard.'
      }
      size={mode === 'REGISTER' && !registeredEmail ? 'lg' : 'md'}
    >
      <div className="space-y-4 pt-1 text-start">
        {/* Top Mode Selector Tabs (only when not in registered/forgot confirmation state) */}
        {!registeredEmail && mode !== 'FORGOT_PASSWORD' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-casa-subtle rounded-xl border border-casa-border-light text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_IN');
                setAuthModalMode('SIGN_IN');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'SIGN_IN'
                  ? 'bg-casa-surface text-casa-brand font-bold shadow-xs border border-casa-border-light'
                  : 'text-casa-text-muted hover:text-casa-text-primary'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setAuthModalMode('REGISTER');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-casa-surface text-casa-brand font-bold shadow-xs border border-casa-border-light'
                  : 'text-casa-text-muted hover:text-casa-text-primary'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Inline Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes('verify') && (
              <div className="pt-1.5 border-t border-red-200 dark:border-red-900 flex items-center justify-between">
                <span className="text-[11px] text-red-600 dark:text-red-400 font-normal">
                  Need a new activation email?
                </span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || !email.trim()}
                  onClick={() => handleResendVerification()}
                  className={`text-[11px] font-bold cursor-pointer underline ${
                    resendCooldown > 0 || !email.trim()
                      ? 'text-casa-text-muted cursor-not-allowed'
                      : 'text-casa-brand hover:text-casa-brand/80'
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Verification Email'}
                </button>
              </div>
            )}
          </div>
        )}

        {resendNotice && mode === 'SIGN_IN' && !registeredEmail && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{resendNotice}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: REGISTRATION SUCCESS / EMAIL VERIFICATION REQUIRED NOTICE */}
        {/* ------------------------------------------------------------- */}
        {registeredEmail ? (
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-casa-text-primary">
                Activate Your Account
              </h3>
              <p className="text-xs text-casa-text-secondary max-w-sm mx-auto leading-relaxed">
                We sent a secure activation link to{' '}
                <strong className="text-casa-text-primary">{registeredEmail}</strong>.
                Please verify your email address to log in to CASA Marketplace.
              </p>
            </div>

            {resendNotice && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium">
                {resendNotice}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  setRegisteredEmail(null);
                  setMode('SIGN_IN');
                  setAuthModalMode('SIGN_IN');
                }}
                className="font-bold py-2.5 shadow-subtle"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleResendVerification}
                className={`text-xs font-semibold py-1.5 cursor-pointer ${
                  resendCooldown > 0
                    ? 'text-casa-text-muted cursor-not-allowed'
                    : 'text-casa-brand hover:underline'
                }`}
              >
                {resendCooldown > 0
                  ? `Resend email in ${resendCooldown}s`
                  : 'Didn’t receive the email? Resend link'}
              </button>
            </div>
          </div>
        ) : mode === 'FORGOT_PASSWORD' ? (
          /* ------------------------------------------------------------- */
          /* VIEW 2: FORGOT PASSWORD FORM */
          /* ------------------------------------------------------------- */
          forgotSubmitted ? (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
                <Send className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-casa-text-primary">
                  Instructions Sent
                </h3>
                <p className="text-xs text-casa-text-secondary max-w-sm mx-auto leading-relaxed">
                  If an account exists with <strong className="text-casa-text-primary">{email}</strong>, you will receive password reset instructions shortly.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setForgotSubmitted(false);
                    setMode('SIGN_IN');
                    setAuthModalMode('SIGN_IN');
                  }}
                  className="font-semibold py-2.5"
                >
                  ← Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="w-4 h-4 text-casa-text-muted" />}
                  autoFocus
                  required
                />
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  fullWidth
                  loading={loading}
                  className="shadow-subtle py-2.5 font-bold"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGN_IN');
                      setAuthModalMode('SIGN_IN');
                      setErrorMsg('');
                    }}
                    className="text-xs text-casa-text-secondary hover:text-casa-text-primary font-medium cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            </form>
          )
        ) : mode === 'SIGN_IN' ? (
          /* ------------------------------------------------------------- */
          /* VIEW 3: SIGN IN FORM */
          /* ------------------------------------------------------------- */
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="w-4 h-4 text-casa-text-muted" />}
                autoFocus
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-casa-text-primary">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('FORGOT_PASSWORD');
                    setErrorMsg('');
                  }}
                  className="text-xs text-casa-brand font-semibold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  prefixIcon={<Lock className="w-4 h-4 text-casa-text-muted" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-casa-text-muted hover:text-casa-text-primary cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                type="submit"
                fullWidth
                loading={loading}
                className="shadow-subtle py-2.5 font-bold"
              >
                <span>Sign In to CASA</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center pt-1 text-xs text-casa-text-muted">
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('REGISTER');
                    setAuthModalMode('REGISTER');
                    setErrorMsg('');
                  }}
                  className="text-casa-brand font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW 4: REGISTRATION FORM */
          /* ------------------------------------------------------------- */
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Account Category Selector */}
            <div className="p-3 bg-casa-canvas/60 rounded-2xl border border-casa-border-light space-y-2">
              <label className="text-xs font-bold text-casa-text-primary block">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-casa-surface border border-casa-border-medium rounded-xl px-3 py-2.5 text-xs font-semibold text-casa-text-primary outline-none focus:ring-2 focus:ring-casa-brand/20 transition-all cursor-pointer"
              >
                <option value="BUYER">🏠 Property Buyer (Buy Homes, Plots & Commercial)</option>
                <option value="TENANT">🔑 Tenant (Rent Flats, Houses & Commercial Spaces)</option>
                <option value="PROPERTY_OWNER">🏢 Property Owner / Seller (Sell or Lease Property)</option>
                <option value="AGENT">🤝 Real Estate Agent (Independent Certified Agent)</option>
                <option value="BROKER">💼 Real Estate Broker (Brokerage Firm / Mandates)</option>
                <option value="DEVELOPER">🏗️ Property Developer / Builder (Townships & Projects)</option>
              </select>
              <p className="text-[11px] text-casa-text-muted leading-relaxed">
                {roleDescriptions[selectedRole] || ''}
              </p>
            </div>

            {/* Full Name & Email (2-column layout on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  prefixIcon={<UserIcon className="w-4 h-4 text-casa-text-muted" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="w-4 h-4 text-casa-text-muted" />}
                  required
                />
              </div>
            </div>

            {/* Mobile Number Field with Country Code */}
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-casa-surface border border-casa-border-medium rounded-xl px-2.5 py-2 text-xs font-medium text-casa-text-primary outline-none focus:ring-2 focus:ring-casa-brand/20 cursor-pointer"
                >
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+971">🇦🇪 +971 (AE)</option>
                  <option value="+966">🇸🇦 +966 (SA)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                </select>
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    prefixIcon={<Phone className="w-4 h-4 text-casa-text-muted" />}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Passwords (2-column layout on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    prefixIcon={<Lock className="w-4 h-4 text-casa-text-muted" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-casa-text-muted hover:text-casa-text-primary cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    prefixIcon={<Lock className="w-4 h-4 text-casa-text-muted" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-casa-text-muted hover:text-casa-text-primary cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Agency/Builder Name if Professional */}
            {['AGENT', 'BROKER', 'DEVELOPER'].includes(selectedRole) && (
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  {selectedRole === 'DEVELOPER'
                    ? 'Builder / Development Entity'
                    : 'Agency or Brokerage Name'}{' '}
                  <span className="text-[10px] text-casa-text-muted font-normal">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder={
                    selectedRole === 'DEVELOPER'
                      ? 'e.g. Skyline Infra Developers'
                      : 'e.g. Apex Realty Consultants'
                  }
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  prefixIcon={<Briefcase className="w-4 h-4 text-casa-text-muted" />}
                />
              </div>
            )}

            {/* Terms Acceptance Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-casa-border-medium text-casa-brand focus:ring-casa-brand/20 cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-[11px] text-casa-text-muted leading-relaxed cursor-pointer select-none">
                I agree to CASA&apos;s{' '}
                <a href="#" className="text-casa-brand hover:underline">
                  Terms of Service
                </a>{' '}
                &{' '}
                <a href="#" className="text-casa-brand hover:underline">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                type="submit"
                fullWidth
                loading={loading}
                className="shadow-subtle py-2.5 font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Account &amp; Register</span>
              </Button>
            </div>

            <div className="text-center pt-1 text-xs text-casa-text-muted">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGN_IN');
                    setAuthModalMode('SIGN_IN');
                    setErrorMsg('');
                  }}
                  className="text-casa-brand font-bold hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
