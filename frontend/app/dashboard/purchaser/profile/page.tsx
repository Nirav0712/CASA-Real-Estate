'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { getPurchaserProfile, updatePurchaserProfile } from '@/services/purchaser-service';
import { PurchaserProfile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CASA_CATEGORIES } from '@/lib/categories';
import {
  SlidersHorizontal,
  User,
  Phone,
  Shield,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function PurchaserProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = React.useState<PurchaserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    avatar: '',
    preferredLanguage: 'en',
    preferredCity: '',
    preferredLocation: '',
    budgetMin: 0,
    budgetMax: 10000000,
    preferredCategory: 'House / Home',
    preferredListingType: 'SALE',
    bedrooms: 2,
    furnishing: 'SEMI_FURNISHED',
  });

  const loadProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPurchaserProfile();
      setProfile(data);
      const meta = data.metadata || {};
      setFormData({
        name: data.name || '',
        email: data.email || '',
        avatar: data.avatar || '',
        preferredLanguage: meta.preferredLanguage || 'en',
        preferredCity: meta.preferredCity || '',
        preferredLocation: meta.preferredLocation || '',
        budgetMin: meta.budgetMin || 0,
        budgetMax: meta.budgetMax || 10000000,
        preferredCategory: meta.preferredCategory || 'House / Home',
        preferredListingType: meta.preferredListingType || 'SALE',
        bedrooms: meta.bedrooms || 2,
        furnishing: meta.furnishing || 'SEMI_FURNISHED',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updatePurchaserProfile({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        avatar: formData.avatar.trim() || undefined,
        preferredLanguage: formData.preferredLanguage,
        preferredCity: formData.preferredCity.trim() || undefined,
        preferredLocation: formData.preferredLocation.trim() || undefined,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        preferredCategory: formData.preferredCategory,
        preferredListingType: formData.preferredListingType,
        bedrooms: Number(formData.bedrooms),
        furnishing: formData.furnishing,
      });

      setProfile(res.user);
      toast.success('Profile Saved', 'Your buyer profile and search preferences have been saved to your account.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
        <div className="h-96 bg-casa-surface border border-casa-border-light rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-start">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-casa-brand" />
          <h2 className="text-xl md:text-2xl font-extrabold text-casa-text-primary tracking-tight">
            Buyer Profile & Preferences
          </h2>
        </div>
        <p className="text-xs text-casa-text-muted mt-1">
          Update your contact details and customize your search criteria for recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account & Security Summary (Read Only / Governance Guard) */}
        <Card className="p-6 border-casa-border-light space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
            <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
              <Shield className="w-4 h-4 text-casa-brand" />
              <span>Account Credentials & Role</span>
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-casa-text-muted bg-casa-subtle px-2.5 py-1 rounded-full border border-casa-border-light">
              <Lock className="w-3 h-3 text-casa-text-muted" />
              <span>Server-Protected</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-casa-canvas border border-casa-border-light space-y-1">
              <span className="text-[10px] text-casa-text-muted uppercase font-bold">Registered Mobile</span>
              <div className="font-bold text-casa-text-primary flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-casa-brand" />
                <span>{profile?.normalizedMobile || user?.normalizedMobile}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-casa-canvas border border-casa-border-light space-y-1">
              <span className="text-[10px] text-casa-text-muted uppercase font-bold">Account Role</span>
              <div className="font-bold text-casa-text-primary">
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                  {profile?.role || user?.role}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-casa-canvas border border-casa-border-light space-y-1">
              <span className="text-[10px] text-casa-text-muted uppercase font-bold">Status</span>
              <div className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{profile?.status || 'ACTIVE'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Details */}
        <Card className="p-6 border-casa-border-light space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2 pb-3 border-b border-casa-border-light">
            <User className="w-4 h-4 text-casa-brand" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arun Kumar"
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. arun.buyer@example.com"
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Profile Avatar URL (Optional)
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>
          </div>
        </Card>

        {/* Buyer Preferences for Recommendations */}
        <Card className="p-6 border-casa-border-light space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2 pb-3 border-b border-casa-border-light">
            <SlidersHorizontal className="w-4 h-4 text-casa-brand" />
            <span>Search & Match Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Preferred City
              </label>
              <input
                type="text"
                value={formData.preferredCity}
                onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                placeholder="e.g. Lucknow, Varanasi, Ayodhya"
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Preferred Locality / Area
              </label>
              <input
                type="text"
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                placeholder="e.g. Gomti Nagar, Indira Nagar"
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Preferred Property Category
              </label>
              <select
                value={formData.preferredCategory}
                onChange={(e) => setFormData({ ...formData, preferredCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              >
                {CASA_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Listing Type
              </label>
              <select
                value={formData.preferredListingType}
                onChange={(e) => setFormData({ ...formData, preferredListingType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
                <option value="LEASE">For Lease</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Min Budget (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Max Budget (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Preferred Bedrooms (BHK)
              </label>
              <select
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              >
                <option value={1}>1 BHK</option>
                <option value={2}>2 BHK</option>
                <option value={3}>3 BHK</option>
                <option value={4}>4 BHK</option>
                <option value={5}>5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-casa-text-primary mb-1.5">
                Furnishing Preference
              </label>
              <select
                value={formData.furnishing}
                onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-casa-surface border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand"
              >
                <option value="FULLY_FURNISHED">Fully Furnished</option>
                <option value="SEMI_FURNISHED">Semi Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            variant="primary"
            size="md"
            className="text-xs font-bold shadow-md"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile & Preferences'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
