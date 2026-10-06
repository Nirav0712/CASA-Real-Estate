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
} from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = React.useState<'PHONE' | 'OTP'>('PHONE');
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phone, setPhone] = React.useState('');
  const [fullName, setFullName] = React.useState('');
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
      setStep('PHONE');
      setPhone('');
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

    setLoading(true);
    try {
      const fullMobile = `${countryCode}${cleanPhone}`;
      const res = await requestOtp(fullMobile, fullName.trim() || undefined);
      setStep('OTP');
      setCooldown(res.cooldownSeconds || 60);
      if (res.devMockOtp) {
        setDevMockOtp(res.devMockOtp);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please check your network.';
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
      await verifyOtp(fullMobile, otp);
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

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={step === 'PHONE' ? 'Sign In / Register' : 'Verify Mobile OTP'}
      description={
        step === 'PHONE'
          ? 'Enter your mobile number to access verified properties, save favorites, and connect with agents.'
          : `We sent a 6-digit verification code to ${countryCode} ${phone}.`
      }
      size="sm"
    >
      <div className="space-y-4 pt-1 text-start">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
            {errorMsg}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                Full Name <span className="text-[10px] text-casa-text-muted font-normal">(Optional for new users)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                type="submit"
                fullWidth
                loading={loading}
                className="shadow-subtle"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-[11px] text-center text-casa-text-muted leading-relaxed">
              By proceeding, you agree to CASA&apos;s <a href="#" className="text-casa-brand hover:underline">Terms of Service</a> & <a href="#" className="text-casa-brand hover:underline">Privacy Policy</a>.
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
                onClick={() => setStep('PHONE')}
                className="text-casa-text-secondary hover:text-casa-text-primary font-medium cursor-pointer"
              >
                ← Change Number
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
                className="shadow-subtle"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Sign In</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
