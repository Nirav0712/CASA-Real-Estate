'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import {
  getMyPropertyById,
  submitPropertyForApproval,
  deleteProperty,
} from '@/services/property-service';
import { Property } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  MapPin,
  Clock,
  AlertCircle,
  Building,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function PropertyDossierPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [property, setProperty] = React.useState<Property | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!id || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getMyPropertyById(id);
      setProperty(data);
    } catch {
      toast.error('Not Found', 'Could not find this property in your account.');
      router.push('/dashboard/properties');
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, router, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadData]);

  const handleSubmit = async () => {
    if (!property) return;
    setIsSubmitting(true);
    try {
      await submitPropertyForApproval(property.id);
      toast.success('Submitted', 'Your listing is now in the CASA review queue.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await deleteProperty(property.id);
      toast.success('Deleted', 'Property removed successfully.');
      router.push('/dashboard/properties');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Error', msg);
    }
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="min-h-[70vh] max-w-lg mx-auto px-4 flex items-center justify-center">
        <div className="text-center p-8 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
          <Building className="w-10 h-10 text-casa-brand mx-auto" />
          <h2 className="text-xl font-bold text-casa-text-primary">Sign In to View Dossier</h2>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-2.5 px-4 rounded-xl bg-casa-brand hover:bg-casa-brand-hover text-white text-xs font-semibold"
          >
            Sign In with Mobile OTP
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !property) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-casa-brand mx-auto" />
      </div>
    );
  }

  const titleStr = typeof property.title === 'string' ? property.title : property.title?.en || 'Untitled';
  const descStr = typeof property.description === 'string' ? property.description : property.description?.en || '';
  const priceNum = typeof property.price === 'number' ? property.price : property.price?.amount || 0;
  const locStr =
    typeof property.location === 'string'
      ? property.location
      : `${property.location?.locality || ''}, ${property.location?.city || 'Lucknow'}`;

  const isDraft = property.status === 'DRAFT';
  const isPending = property.status === 'PENDING_REVIEW' || property.status === 'PENDING_APPROVAL';
  const isPublished = property.status === 'PUBLISHED' || property.status === 'ACTIVE';
  const isRejected = property.status === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-casa-border-light">
        <div>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1 text-xs text-casa-brand hover:underline font-semibold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Properties</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
            {titleStr}
          </h1>
          <p className="text-xs text-casa-text-secondary">
            Ref ID: <span className="font-mono font-bold text-casa-brand">{property.referenceId || property.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPublished && (
            <Link
              href={`/property/${property.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-casa-brand bg-casa-brand-subtle rounded-xl"
            >
              <Eye className="w-4 h-4" />
              <span>View Live Listing</span>
            </Link>
          )}

          <Link
            href={`/dashboard/properties/${property.id}/edit`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-casa-text-primary border border-casa-border-light bg-casa-surface hover:bg-casa-canvas rounded-xl"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Link>

          {(isDraft || isRejected) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-casa-brand hover:bg-casa-brand-hover rounded-xl shadow-2xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isRejected ? 'Resubmit' : 'Submit for Review'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {isPublished && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <div>
            <span className="font-bold block">Live on CASA Marketplace</span>
            <span>This listing is approved, indexed, and visible to all prospective buyers.</span>
          </div>
        </div>
      )}

      {isPending && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold block">In Moderation Review</span>
            <span>CASA administrators are currently reviewing your documents and photos.</span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs space-y-1.5 text-red-800 dark:text-red-300">
          <div className="font-bold flex items-center gap-1.5 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Listing Rejected by CASA Moderation</span>
          </div>
          <p className="text-[11px]">
            Reason: <strong>{property.moderation?.rejectionReason || 'INSUFFICIENT_DOCS'}</strong>
            {property.moderation?.adminRemark && ` — ${property.moderation.adminRemark}`}
          </p>
          <div className="pt-2">
            <Link
              href={`/dashboard/properties/${property.id}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px]"
            >
              <Edit className="w-3 h-3" />
              <span>Edit and Resubmit</span>
            </Link>
          </div>
        </div>
      )}

      {/* Property Details Card */}
      <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-6 shadow-subtle space-y-6 text-xs">
        {/* Gallery */}
        {property.media?.images && property.media.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {property.media.images.map((img, idx) => (
              <div key={idx} className="h-32 rounded-xl overflow-hidden border border-casa-border-light bg-casa-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light">
            <span className="text-casa-text-muted text-[10px] block">Price / Rent</span>
            <span className="font-bold text-casa-brand text-sm">{formatPrice(priceNum)}</span>
          </div>
          <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light">
            <span className="text-casa-text-muted text-[10px] block">Category</span>
            <span className="font-bold text-casa-text-primary">{property.category}</span>
          </div>
          <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light">
            <span className="text-casa-text-muted text-[10px] block">Listing Type</span>
            <span className="font-bold text-casa-text-primary">{property.listingType}</span>
          </div>
          <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light">
            <span className="text-casa-text-muted text-[10px] block">Area</span>
            <span className="font-bold text-casa-text-primary">{property.specs?.carpetAreaSqFt || property.specs?.area || 'N/A'} Sq.Ft</span>
          </div>
        </div>

        {/* Description & Location */}
        <div className="space-y-3">
          <div className="p-4 bg-casa-canvas rounded-xl border border-casa-border-light space-y-1">
            <span className="font-semibold text-casa-text-primary block">Description</span>
            <p className="text-casa-text-secondary leading-relaxed">{descStr}</p>
          </div>

          <div className="p-4 bg-casa-canvas rounded-xl border border-casa-border-light flex items-center gap-2">
            <MapPin className="w-4 h-4 text-casa-brand flex-shrink-0" />
            <span className="font-medium text-casa-text-primary">{locStr}</span>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <span className="font-semibold text-casa-text-primary block mb-2">Amenities</span>
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.map((am, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-casa-subtle text-[11px] text-casa-text-secondary border border-casa-border-light">
                  {am}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
