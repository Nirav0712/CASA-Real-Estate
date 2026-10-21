'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getMyVerification,
  uploadVerificationDocument,
  submitVerification,
} from '@/services/agent-service';
import { AgentDocument, AgentVerificationStatus } from '@/types';
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Building,
  XCircle,
  RefreshCw,
  ExternalLink,
  Phone,
  Sparkles,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

const DOC_TYPES = [
  { id: 'GST_CERTIFICATE', label: 'GST Registration Certificate', requiresBack: false },
  { id: 'UDYAM_CERTIFICATE', label: 'Udyam Registration Certificate', requiresBack: false },
  { id: 'RERA_CERTIFICATE', label: 'RERA Registration Certificate / License', requiresBack: false },
  { id: 'AADHAAR_CARD', label: 'Aadhaar Card (National ID)', requiresBack: true },
  { id: 'OTHER', label: 'Other Business / Identity Proof Document', requiresBack: false },
];

export default function KycVerificationDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [verificationData, setVerificationData] = React.useState<{
    kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    kycRejectionReason?: string;
    kycApprovedAt?: string;
    isTrialActive?: boolean;
    trialStartedAt?: string;
    trialExpiresAt?: string;
    documents: AgentDocument[];
    reraNumber?: string;
    agencyName?: string;
  } | null>(null);

  // Form State
  const [documentType, setDocumentType] = React.useState('GST_CERTIFICATE');
  const [documentNumber, setDocumentNumber] = React.useState('');
  const [agencyName, setAgencyName] = React.useState('');
  const [frontFileUrl, setFrontFileUrl] = React.useState<string | null>(null);
  const [frontFileName, setFrontFileName] = React.useState<string>('');
  const [backFileUrl, setBackFileUrl] = React.useState<string | null>(null);
  const [backFileName, setBackFileName] = React.useState<string>('');

  const loadData = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getMyVerification();
      setVerificationData({
        kycStatus: res.kycStatus || (res.verificationStatus as any) || 'NOT_SUBMITTED',
        kycRejectionReason: res.kycRejectionReason || res.rejectionReason,
        kycApprovedAt: res.kycApprovedAt || res.verifiedAt,
        isTrialActive: Boolean(res.isTrialActive),
        trialStartedAt: res.trialStartedAt ?? undefined,
        trialExpiresAt: res.trialExpiresAt ?? undefined,
        documents: res.documents || [],
        reraNumber: res.reraNumber,
        agencyName: res.agencyName,
      });
      if (res.reraNumber) {
        setDocumentNumber((prev) => prev || res.reraNumber || '');
      }
      if (res.agencyName) {
        setAgencyName((prev) => prev || res.agencyName || '');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch verification status';
      toast.error('Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else if (!isAuthLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadData]);

  // Handle Front File Selection
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum file size is 10MB.');
      return;
    }

    setFrontFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFrontFileUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Back File Selection
  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum file size is 10MB.');
      return;
    }

    setBackFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackFileUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Submit KYC Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontFileUrl) {
      toast.error('Document Required', 'Please upload at least the front side of your verification document.');
      return;
    }

    const selectedDocTypeObj = DOC_TYPES.find((d) => d.id === documentType);
    if (selectedDocTypeObj?.requiresBack && !backFileUrl) {
      toast.warning('Back Side Required', `Please upload both front and back sides for ${selectedDocTypeObj.label}.`);
      return;
    }

    setSubmitting(true);
    try {
      await uploadVerificationDocument({
        documentType,
        documentName: frontFileName || `${documentType}_document`,
        documentNumber: documentNumber.trim(),
        documentUrl: frontFileUrl,
        frontDocumentUrl: frontFileUrl,
        backDocumentUrl: backFileUrl || undefined,
        accountType: user?.accountType || user?.role,
      });

      // Also submit verification record with agency/RERA
      if (documentNumber.trim()) {
        await submitVerification({
          reraNumber: documentNumber.trim(),
          reraState: 'Uttar Pradesh',
          notes: agencyName ? `Agency: ${agencyName}` : undefined,
        }).catch(() => null);
      }

      toast.success(
        'Documents Submitted for Governance Review',
        'Your KYC documents have been sent to the Super Admin. You will receive a verification call from +91 7069754589.',
      );

      // Reset file selections
      setFrontFileUrl(null);
      setFrontFileName('');
      setBackFileUrl(null);
      setBackFileName('');

      if (refreshUser) await refreshUser();
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit KYC documents';
      toast.error('Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-casa-brand animate-spin" />
        <p className="text-xs text-casa-text-muted">Loading KYC verification status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Lock className="w-12 h-12 text-casa-brand mx-auto" />
        <h2 className="text-xl font-bold text-casa-text-primary">Sign In Required</h2>
        <p className="text-xs text-casa-text-secondary max-w-sm">
          Please sign in to your Broker Agency, Broker, Agent, or Developer account to submit and view your KYC verification.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 rounded-xl bg-casa-brand text-white text-xs font-bold shadow-md hover:bg-casa-brand-hover"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const kycStatus = verificationData?.kycStatus || 'NOT_SUBMITTED';
  const isApproved = kycStatus === 'APPROVED';
  const isPending = kycStatus === 'PENDING';
  const isRejected = kycStatus === 'REJECTED';

  // Calculate remaining trial days
  let trialRemainingDays = 0;
  if (verificationData?.trialExpiresAt) {
    const diff = new Date(verificationData.trialExpiresAt).getTime() - Date.now();
    trialRemainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-casa-brand-subtle text-casa-brand rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              KYC & Account Verification
            </h1>
          </div>
          <p className="text-xs text-casa-text-secondary">
            Mandatory governance verification for Broker Agencies, Brokers, Agents, and Developer accounts.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-casa-border-medium text-xs font-semibold text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Verification Call Notice Banner (Requirement 8) */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-subtle">
        <Phone className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-sm">
            Important Notice — KYC Verification Call:
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            You may receive a verification call from{' '}
            <strong className="font-bold underline text-amber-950 dark:text-white">
              7069754589
            </strong>{' '}
            to complete your account and identity verification. Please keep your registered phone reachable.
          </p>
        </div>
      </div>

      {/* Status Banners */}
      {isApproved && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                KYC Verification Approved & Account Activated!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Your account is fully verified. Your official Verified Trust Badge is active on all listings.
              </p>
            </div>
          </div>

          {/* 3-Day Free Trial Duration & Activation Status Card (Requirement 3) */}
          <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 dark:border-emerald-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-casa-text-primary">
                      3-Day Free Trial
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      Account Status: Active
                    </span>
                  </div>
                  <p className="text-xs text-casa-text-muted mt-0.5">
                    Your trial includes full access to property listings and buyer lead discovery.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto border border-emerald-300 dark:border-emerald-700">
                {trialRemainingDays > 0 ? `${trialRemainingDays} Day${trialRemainingDays !== 1 ? 's' : ''} Remaining` : 'Trial Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                  Trial Start Date
                </span>
                <span className="font-bold text-casa-text-primary text-sm">
                  {verificationData?.trialStartedAt
                    ? new Date(verificationData.trialStartedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Upon Verification Approval'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold text-casa-text-muted uppercase tracking-wider block">
                  Trial Expiry Date
                </span>
                <span className="font-bold text-casa-text-primary text-sm">
                  {verificationData?.trialExpiresAt
                    ? new Date(verificationData.trialExpiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'In 3 Days'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-subtle">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Documents Under Super Admin Review
            </h3>
            <p className="text-amber-800 dark:text-amber-300">
              Your KYC documents have been submitted and are in the review queue.
              Our moderation team reviews submissions within 24 hours. Your <strong>3-Day Free Trial</strong> will start immediately once approved.
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 pt-1">
              Need to upload replacement files? Submit the form below to append new documents.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-900 dark:text-rose-200 shadow-subtle">
          <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
              KYC Verification Rejected
            </h3>
            <p className="text-rose-800 dark:text-rose-300">
              <strong>Reason from Super Admin:</strong>{' '}
              {verificationData?.kycRejectionReason || 'Document was illegible or invalid. Please re-upload.'}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 pt-1">
              Please review the reason, correct the document, and resubmit using the form below.
            </p>
          </div>
        </div>
      )}

      {/* KYC Upload Form */}
      {(!isApproved || isRejected) && (
        <form
          onSubmit={handleSubmit}
          className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 shadow-subtle space-y-6"
        >
          <div className="flex items-center gap-2 border-b border-casa-border-light pb-3">
            <Upload className="w-5 h-5 text-casa-brand" />
            <h2 className="text-sm md:text-base font-bold text-casa-text-primary">
              {isRejected ? 'Resubmit Verification Documents' : 'Upload Verification Documents'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                Select Document Proof Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-casa-canvas border border-casa-border-medium rounded-xl px-3.5 py-2.5 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand font-medium"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                Registration / Certificate / ID Number
              </label>
              <input
                type="text"
                placeholder="e.g. 09AAAAA0000A1Z5 or UPRERAAGT12345"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full bg-casa-canvas border border-casa-border-medium rounded-xl px-3.5 py-2.5 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand font-mono"
              />
            </div>

            {/* Agency / Firm Name (if applicable) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-casa-text-primary uppercase tracking-wider">
                Agency / Firm / Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Skyline Realty Agency Pvt Ltd"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-casa-canvas border border-casa-border-medium rounded-xl px-3.5 py-2.5 text-xs text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand font-medium"
              />
            </div>
          </div>

          {/* Dual File Upload: Front and Back */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Front Side Upload */}
            <div className="border-2 border-dashed border-casa-border-medium rounded-2xl p-4 text-center space-y-3 bg-casa-canvas/50 hover:bg-casa-canvas transition-colors">
              <FileText className="w-8 h-8 text-casa-brand mx-auto" />
              <div>
                <p className="text-xs font-bold text-casa-text-primary">
                  Document Front Side *
                </p>
                <p className="text-[11px] text-casa-text-muted mt-0.5">
                  PDF, JPG, JPEG, or PNG (up to 10MB)
                </p>
              </div>

              {frontFileName ? (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-mono font-bold truncate">
                  ✓ {frontFileName}
                </div>
              ) : null}

              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-casa-brand text-white text-xs font-bold cursor-pointer hover:bg-casa-brand-hover shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{frontFileName ? 'Replace Front File' : 'Choose Front File'}</span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleFrontFileChange}
                />
              </label>
            </div>

            {/* Back Side Upload */}
            <div className="border-2 border-dashed border-casa-border-medium rounded-2xl p-4 text-center space-y-3 bg-casa-canvas/50 hover:bg-casa-canvas transition-colors">
              <FileText className="w-8 h-8 text-casa-text-muted mx-auto" />
              <div>
                <p className="text-xs font-bold text-casa-text-primary">
                  Document Back Side {documentType === 'AADHAAR_CARD' ? '*' : '(Optional)'}
                </p>
                <p className="text-[11px] text-casa-text-muted mt-0.5">
                  Required for Aadhaar, optional for certificates
                </p>
              </div>

              {backFileName ? (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-mono font-bold truncate">
                  ✓ {backFileName}
                </div>
              ) : null}

              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-casa-subtle text-casa-text-primary border border-casa-border-medium text-xs font-bold cursor-pointer hover:bg-casa-canvas shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{backFileName ? 'Replace Back File' : 'Choose Back File'}</span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleBackFileChange}
                />
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-casa-border-light">
            <span className="text-[11px] text-casa-text-muted">
              🔒 Documents are securely encrypted and viewed only by authorized verification officers.
            </span>

            <button
              type="submit"
              disabled={submitting || !frontFileUrl}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-casa-brand text-white text-xs font-bold shadow-md hover:bg-casa-brand-hover disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Documents...</span>
                </>
              ) : (
                <>
                  <span>Submit for KYC Verification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Uploaded Documents History */}
      {verificationData && verificationData.documents.length > 0 && (
        <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-casa-brand" />
            Uploaded Documents Portfolio ({verificationData.documents.length})
          </h3>

          <div className="space-y-2">
            {verificationData.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-casa-canvas border border-casa-border-light rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-casa-text-primary block">
                    {doc.documentName || doc.documentType}
                  </span>
                  <span className="text-[11px] text-casa-text-muted">
                    Type: {doc.documentType} | Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                  {(doc.documentUrl || doc.frontDocumentUrl) && (
                    <a
                      href={doc.documentUrl || doc.frontDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-casa-brand hover:underline inline-flex items-center"
                      title="Preview Document"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
