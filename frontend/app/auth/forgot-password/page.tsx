'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, KeyRound, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import * as authService from '@/services/auth-service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to request password reset.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-casa-canvas via-casa-surface to-casa-canvas">
      <div className="w-full max-w-md bg-casa-surface border border-casa-border-medium rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-casa-brand/10 border border-casa-brand/20 rounded-xl flex items-center justify-center text-casa-brand font-bold text-lg">
            C
          </div>
          <span className="text-xl font-black tracking-tight text-casa-text-primary">
            CASA<span className="text-casa-brand">.</span>
          </span>
        </div>

        {submitted ? (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400 animate-in zoom-in-95">
              <Send className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-casa-text-primary">
                Instructions Dispatched
              </h2>
              <p className="text-xs text-casa-text-secondary max-w-xs mx-auto leading-relaxed">
                If an account exists with <strong className="text-casa-text-primary">{email}</strong>, you will receive password reset instructions in your inbox shortly.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" size="lg" fullWidth className="font-semibold py-2.5">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Homepage</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-start">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-bold text-casa-text-primary">
                Reset Your Password
              </h2>
              <p className="text-xs text-casa-text-muted max-w-xs mx-auto">
                Enter your registered email address to receive password reset link.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Link
                    href="/"
                    className="text-xs text-casa-text-secondary hover:text-casa-text-primary font-medium inline-block py-1"
                  >
                    ← Return to Home / Sign In
                  </Link>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
