'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sparkles,
  UserCheck,
  Building2,
  Home,
  User as UserIcon,
  Briefcase,
  Lock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

type AuthMode = 'REGISTER' | 'SIGN_IN';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = React.useState<AuthMode>('REGISTER');
  const [step, setStep] = React.useState<'INPUT' | 'OTP'>('INPUT');
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phone, setPhone] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('AGENT');
  const [agencyName, setAgencyName] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [devMockOtp, setDevMockOtp] = React.useState<string | undefined>(undefined);

  // Timer for resend cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset state on modal open/close
  React.useEffect(() => {
    if (!isAuthModalOpen) {
      setStep('INPUT');
      setPhone('');
      setFullName('');
      setSelectedRole('AGENT');
      setAgencyName('');
      setOtp('');
      setErrorMsg('');
      setDevMockOtp(undefined);
    }
  }, [isAuthModalOpen]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (mode === 'REGISTER' && !fullName.trim()) {
      setErrorMsg('Please enter your Full Name to register.');
      return;
    }

    setLoading(true);
    try {
      const fullMobile = `${countryCode}${cleanPhone}`;
      const isProfessional = ['AGENT', 'BROKER', 'DEVELOPER'].includes(selectedRole);
      const res = await requestOtp(
        fullMobile,
        mode === 'REGISTER' ? fullName.trim() : undefined,
        mode === 'REGISTER' ? selectedRole : undefined,
        mode === 'REGISTER' && isProfessional ? agencyName.trim() || undefined : undefined,
      );
      setStep('OTP');
      setCooldown(res.cooldownSeconds || 60);
      if (res.devMockOtp) {
        setDevMockOtp(res.devMockOtp);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send OTP. Please check your network.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (otp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullMobile = `${countryCode}${cleanPhone}`;
      const isProfessional = ['AGENT', 'BROKER', 'DEVELOPER'].includes(selectedRole);
      await verifyOtp(
        fullMobile,
        otp,
        mode === 'REGISTER' ? fullName.trim() : undefined,
        mode === 'REGISTER' ? selectedRole : undefined,
        mode === 'REGISTER' && isProfessional ? agencyName.trim() || undefined : undefined,
      );

      if (mode === 'REGISTER') {
        if (selectedRole === 'DEVELOPER') {
          router.push('/dashboard/developer');
        } else if (selectedRole === 'BROKER') {
          router.push('/dashboard/broker');
        } else if (selectedRole === 'AGENT') {
          router.push('/dashboard/agent');
        } else if (selectedRole === 'PROPERTY_OWNER') {
          router.push('/dashboard/properties');
        } else if (selectedRole === 'TENANT') {
          router.push('/dashboard/tenant');
        } else {
          router.push('/dashboard/purchaser');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDevMock = () => {
    if (devMockOtp) {
      setOtp(devMockOtp);
    }
  };

  const roleDescriptions: Record<string, string> = {
    BUYER: 'Explore verified properties, save favorites, compare homes, and schedule site visits.',
    TENANT: 'Search verified rental homes, book apartment walk-throughs, and chat directly with owners.',
    PROPERTY_OWNER: 'List your flat, villa, plot, or commercial space for direct sale or rent.',
    AGENT: 'List client properties, receive buyer leads, and apply for CASA RERA verification.',
    BROKER: 'Manage brokerage portfolio, commercial mandates, and verified commission deals.',
    DEVELOPER: 'Manage builder townships, project phases, digital floor plans, and direct buyer leads.',
    PURCHASER: 'Explore verified properties, save favorites, and connect directly with certified agents.',
    SUPER_ADMIN: 'System administration and governance.',
    ADMIN: 'Administrative operations.',
    MODERATOR: 'Content and listing moderation.',
    VERIFIED_AGENT: 'CASA Verified Agent badge holder.',
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={
        step === 'OTP'
          ? 'Verify Mobile OTP'
          : mode === 'REGISTER'
          ? 'Create Account & Register'
          : 'Welcome Back — Sign In'
      }
      description={
        step === 'OTP'
          ? `We sent a 6-digit verification code to ${countryCode} ${phone}.`
          : mode === 'REGISTER'
          ? 'Select your user category and register your account on CASA Marketplace.'
          : 'Enter your registered mobile number to sign in.'
      }
      size="md"
    >
      <div className="space-y-4 pt-1 text-start">
        {/* Top Mode Selector Tabs (only shown on INPUT step) */}
        {step === 'INPUT' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-casa-subtle rounded-xl border border-casa-border-light text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-casa-surface text-casa-brand font-bold shadow-xs border border-casa-border-light'
                  : 'text-casa-text-muted hover:text-casa-text-primary'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Register (New User)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_IN');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'SIGN_IN'
                  ? 'bg-casa-surface text-casa-brand font-bold shadow-xs border border-casa-border-light'
                  : 'text-casa-text-muted hover:text-casa-text-primary'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In (Existing)</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
            {errorMsg}
          </div>
        )}

        {step === 'INPUT' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            {/* Category / Role Dropdown when Registering */}
            {mode === 'REGISTER' && (
              <div className="space-y-3 p-3.5 bg-casa-canvas/60 rounded-2xl border border-casa-border-light">
                <div>
                  <label className="text-xs font-bold text-casa-text-primary block mb-1.5">
                    What are you registering for? (Account Type) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full bg-casa-surface border border-casa-border-medium rounded-xl px-3 py-2.5 text-xs font-semibold text-casa-text-primary outline-none focus:ring-2 focus:ring-casa-brand/20 transition-all cursor-pointer"
                    >
                      <option value="BUYER">🏠 Property Buyer (Buy Homes, Plots & Commercial)</option>
                      <option value="TENANT">🔑 Tenant (Rent Flats, Houses & Commercial Spaces)</option>
                      <option value="PROPERTY_OWNER">🏢 Property Owner / Seller (Sell or Lease My Property)</option>
                      <option value="AGENT">🤝 Real Estate Agent (Independent Certified Agent)</option>
                      <option value="BROKER">💼 Real Estate Broker (Brokerage Firm / Mandates)</option>
                      <option value="DEVELOPER">🏗️ Property Developer / Builder (Townships & Projects)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-casa-text-muted mt-1.5 leading-relaxed">
                    {roleDescriptions[selectedRole] || ''}
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Optional Agency/Company Name if Professional */}
                {['AGENT', 'BROKER', 'DEVELOPER'].includes(selectedRole) && (
                  <div>
                    <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                      {selectedRole === 'DEVELOPER' ? 'Builder / Company Name' : 'Agency or Brokerage Name'}{' '}
                      <span className="text-[10px] text-casa-text-muted font-normal">(Optional)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder={selectedRole === 'DEVELOPER' ? 'e.g. Skyline Infra Developers' : 'e.g. Apex Realty & Consultants'}
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      prefixIcon={<Briefcase className="w-3.5 h-3.5 text-casa-text-muted" />}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Mobile Number Field */}
            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-casa-surface border border-casa-border-medium rounded-xl px-2.5 py-2 text-xs font-medium text-casa-text-primary outline-none focus:ring-2 focus:ring-casa-brand/20"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    prefixIcon={<Phone className="w-3.5 h-3.5 text-casa-text-muted" />}
                    autoFocus={mode === 'SIGN_IN'}
                  />
                </div>
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
                <span>{mode === 'REGISTER' ? 'Register & Send OTP' : 'Sign In with OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Bottom Toggle Text */}
            <div className="text-center pt-1 text-xs text-casa-text-muted">
              {mode === 'REGISTER' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGN_IN');
                      setErrorMsg('');
                    }}
                    className="text-casa-brand font-bold hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              ) : (
                <p>
                  Don&apos;t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('REGISTER');
                      setErrorMsg('');
                    }}
                    className="text-casa-brand font-bold hover:underline cursor-pointer"
                  >
                    Register / Create Account
                  </button>
                </p>
              )}
            </div>

            <p className="text-[11px] text-center text-casa-text-muted leading-relaxed">
              By proceeding, you agree to CASA&apos;s{' '}
              <a href="#" className="text-casa-brand hover:underline">
                Terms of Service
              </a>{' '}
              &{' '}
              <a href="#" className="text-casa-brand hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Dev Mock Auto-Fill Banner */}
            {devMockOtp && (
              <div
                onClick={handleFillDevMock}
                className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-casa-brand flex-shrink-0" />
                  <span className="text-blue-900 dark:text-blue-200 font-medium">
                    Dev Mock OTP: <strong className="font-mono tracking-widest">{devMockOtp}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-casa-brand font-bold uppercase underline">
                  Auto-Fill
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Enter 6-Digit Code
              </label>
              <Input
                type="text"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={6}
                className="text-center font-mono text-lg tracking-[0.5em] font-bold"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="text-casa-text-secondary hover:text-casa-text-primary font-medium cursor-pointer"
              >
                ← Change Details
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={() => handleRequestOtp()}
                className={`font-semibold cursor-pointer flex items-center gap-1 ${
                  cooldown > 0
                    ? 'text-casa-text-muted cursor-not-allowed'
                    : 'text-casa-brand hover:underline'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? '' : 'animate-spin-once'}`} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
              </button>
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
                <span>{mode === 'REGISTER' ? 'Verify & Complete Registration' : 'Verify & Sign In'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
