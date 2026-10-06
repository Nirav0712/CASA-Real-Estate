'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getMyVerification,
  submitVerification,
  uploadVerificationDocument,
} from '@/services/agent-service';
import { AgentDocument, AgentVerificationStatus } from '@/types';
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  FileCheck2,
  UploadCloud,
  FileText,
  Send,
  Building,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AgentVerificationPage() {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();

  const [verificationStatus, setVerificationStatus] =
    React.useState<AgentVerificationStatus>('NOT_SUBMITTED');
  const [isVerified, setIsVerified] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState<string | undefined>();
  const [verifiedAt, setVerifiedAt] = React.useState<string | undefined>();
  const [documents, setDocuments] = React.useState<AgentDocument[]>([]);

  const [formData, setFormData] = React.useState({
    reraNumber: '',
    reraState: 'Uttar Pradesh',
    reraAuthority: 'UP-RERA',
    notes: '',
  });

  const [docUpload, setDocUpload] = React.useState({
    documentType: 'RERA_CERTIFICATE',
    documentUrl: '',
    documentName: '',
    documentNumber: '',
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);

  const loadVerification = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getMyVerification();
      setVerificationStatus(data.verificationStatus);
      setIsVerified(data.isVerifiedAgent);
      setRejectionReason(data.rejectionReason);
      setVerifiedAt(data.verifiedAt);
      setDocuments(data.documents || []);
      if (data.reraNumber) {
        setFormData((prev) => ({
          ...prev,
          reraNumber: data.reraNumber || '',
          reraState: data.reraState || prev.reraState,
          reraAuthority: data.reraAuthority || prev.reraAuthority,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load verification status.';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadVerification();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadVerification]);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUpload.documentUrl || !docUpload.documentName) {
      toast.error('Validation Error', 'Please specify document name and valid file URL.');
      return;
    }
    setIsUploadingDoc(true);
    try {
      const res = await uploadVerificationDocument({
        documentType: docUpload.documentType,
        documentUrl: docUpload.documentUrl,
        documentName: docUpload.documentName,
        documentNumber: docUpload.documentNumber || formData.reraNumber,
      });
      setDocuments((prev) => [res.document, ...prev]);
      setDocUpload({
        documentType: 'RERA_CERTIFICATE',
        documentUrl: '',
        documentName: '',
        documentNumber: '',
      });
      toast.success('Document Uploaded', 'Document added to your verification portfolio.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not upload document.';
      toast.error('Upload Error', msg);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reraNumber) {
      toast.error('Validation Error', 'RERA Registration Number is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await submitVerification(formData);
      setVerificationStatus(res.status);
      toast.success('Application Submitted', 'Your verification application is now in the admin review queue.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit verification.';
      toast.error('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading RERA Verification Details...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Login Required</h2>
        <button
          onClick={openAuthModal}
          className="mt-4 px-6 py-2.5 bg-casa-600 text-white rounded-xl font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">RERA & Business Verification</h1>
            {isVerified ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                VERIFIED
              </span>
            ) : verificationStatus === 'PENDING' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5 mr-1" />
                UNDER REVIEW
              </span>
            ) : verificationStatus === 'REJECTED' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                REJECTED
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                NOT SUBMITTED
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Submit your official state Real Estate Regulatory Authority registration details and license documents.
          </p>
        </div>

        <button
          onClick={loadVerification}
          className="inline-flex items-center px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Status
        </button>
      </div>

      {/* Rejection Alert */}
      {verificationStatus === 'REJECTED' && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-900 text-sm">Verification Application Rejected</h4>
            <p className="text-sm text-rose-700">{rejectionReason || 'Please review your documents and resubmit.'}</p>
            <p className="text-xs text-rose-600 mt-1">
              You may upload corrected documents and submit again for administrative audit.
            </p>
          </div>
        </div>
      )}

      {/* Verified Banner */}
      {isVerified && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start space-x-4">
          <div className="p-3 bg-white rounded-xl shadow-xs text-emerald-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900">CASA Verified Agent Active</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Your RERA credentials ({formData.reraNumber || 'Registered'}) are verified by the CASA governance team.
              Your listings display the official verified trust badge.
            </p>
            {verifiedAt && (
              <p className="text-xs text-emerald-600 mt-2">Verified on: {new Date(verifiedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Verification Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center">
          <Building className="w-5 h-5 mr-2 text-casa-600" />
          RERA Registration Details
        </h2>

        <form onSubmit={handleSubmitVerification} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                RERA Registration Number *
              </label>
              <input
                type="text"
                required
                disabled={isVerified || verificationStatus === 'PENDING'}
                value={formData.reraNumber}
                onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 disabled:opacity-70"
                placeholder="e.g. UPRERAAGT12345"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                RERA State *
              </label>
              <input
                type="text"
                required
                disabled={isVerified || verificationStatus === 'PENDING'}
                value={formData.reraState}
                onChange={(e) => setFormData({ ...formData, reraState: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 disabled:opacity-70"
                placeholder="Uttar Pradesh"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                RERA Authority
              </label>
              <input
                type="text"
                disabled={isVerified || verificationStatus === 'PENDING'}
                value={formData.reraAuthority}
                onChange={(e) => setFormData({ ...formData, reraAuthority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 disabled:opacity-70"
                placeholder="UP-RERA"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes for CASA Moderation Team
              </label>
              <textarea
                rows={2}
                disabled={isVerified || verificationStatus === 'PENDING'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 disabled:opacity-70"
                placeholder="Optional comments regarding your agency credentials or previous registrations..."
              />
            </div>
          </div>

          {!isVerified && verificationStatus !== 'PENDING' && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2.5 bg-casa-600 text-white font-semibold rounded-xl hover:bg-casa-700 transition shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Verification Request'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Document Upload Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center">
          <UploadCloud className="w-5 h-5 mr-2 text-casa-600" />
          Verification Documents
        </h2>

        {/* Upload Form */}
        {!isVerified && verificationStatus !== 'PENDING' && (
          <form onSubmit={handleUploadDoc} className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upload New Verification Document
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Document Type *</label>
                <select
                  value={docUpload.documentType}
                  onChange={(e) => setDocUpload({ ...docUpload, documentType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="RERA_CERTIFICATE">RERA Certificate</option>
                  <option value="AGENCY_LICENSE">Agency Business License</option>
                  <option value="IDENTITY_DOCUMENT">Identity Document (Aadhaar/PAN)</option>
                  <option value="ADDRESS_PROOF">Office Address Proof</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docUpload.documentName}
                  onChange={(e) => setDocUpload({ ...docUpload, documentName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  placeholder="e.g. UP RERA Registration PDF"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Document URL *</label>
                <input
                  type="url"
                  required
                  value={docUpload.documentUrl}
                  onChange={(e) => setDocUpload({ ...docUpload, documentUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                  placeholder="https://storage.provider/doc.pdf"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploadingDoc}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
              >
                {isUploadingDoc ? 'Uploading...' : 'Add Document'}
              </button>
            </div>
          </form>
        )}

        {/* Uploaded Documents List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Submitted Document Portfolio</h3>
          {documents.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload your official RERA Certificate to expedite admin approval.
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id || doc.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-3">
                  <div className="p-2 bg-white rounded-lg shadow-2xs text-casa-600 shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{doc.documentName}</p>
                    <p className="text-xs text-slate-500">
                      {doc.documentType.replace('_', ' ')} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      doc.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : doc.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-casa-600 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
