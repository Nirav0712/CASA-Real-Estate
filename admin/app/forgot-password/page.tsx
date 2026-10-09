'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as authService from '@/services/auth-service';
import { Building2, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotAdminPassword(email.trim());
      setMessage(
        res.message ||
          'If an account exists for this email, password reset instructions have been sent.',
      );
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset link.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casa-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-start">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-casa-brand text-white flex items-center justify-center mx-auto shadow-subtle">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-casa-text-primary tracking-tight">
            Reset Administrator Password
          </h1>
          <p className="text-xs text-casa-text-muted">
            Enter your registered administrator email to receive secure recovery instructions.
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 shadow-subtle bg-casa-surface border border-casa-border-light space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-casa-text-primary">Check Your Inbox</h2>
                <p className="text-xs text-casa-text-muted leading-relaxed">{message}</p>
              </div>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" size="md" fullWidth>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Return to Login</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-casa-text-primary block mb-1.5">
                  Administrator Email Address
                </label>
                <Input
                  type="email"
                  placeholder="admin@casarealestate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="w-3.5 h-3.5 text-casa-text-muted" />}
                  autoFocus
                  required
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
                  <span>Send Password Reset Link</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-casa-text-muted hover:text-casa-text-primary font-medium"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Administrator Login</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
