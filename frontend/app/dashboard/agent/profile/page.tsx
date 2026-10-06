'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { getMyAgentProfile, updateMyAgentProfile } from '@/services/agent-service';
import { AgentProfile } from '@/types';
import {
  UserCheck,
  ShieldCheck,
  Phone,
  MapPin,
  Save,
  ExternalLink,
} from 'lucide-react';

export default function AgentProfilePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = React.useState<Partial<AgentProfile>>({
    displayName: '',
    agencyName: '',
    professionalTitle: 'Licensed Real Estate Consultant',
    bio: '',
    experienceYears: 5,
    phone: '',
    email: '',
    website: '',
    officeAddress: {
      address: '',
      locality: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
    },
    areasServed: [],
    languages: ['English', 'Hindi'],
    specializations: ['Residential Sales', 'Luxury Apartments', 'Commercial Leasing'],
    socialLinks: {
      linkedin: '',
      facebook: '',
      instagram: '',
      twitter: '',
    },
  });

  const [areasInput, setAreasInput] = React.useState('');
  const [languagesInput, setLanguagesInput] = React.useState('');
  const [specializationsInput, setSpecializationsInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadProfile = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getMyAgentProfile();
      setProfile(data);
      if (data.areasServed) setAreasInput(data.areasServed.join(', '));
      if (data.languages) setLanguagesInput(data.languages.join(', '));
      if (data.specializations) setSpecializationsInput(data.specializations.join(', '));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile.';
      toast.error('Load Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<AgentProfile> = {
        displayName: profile.displayName,
        agencyName: profile.agencyName,
        agencyLogo: profile.agencyLogo,
        profileImage: profile.profileImage,
        professionalTitle: profile.professionalTitle,
        bio: profile.bio,
        experienceYears: Number(profile.experienceYears) || 0,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        officeAddress: profile.officeAddress,
        socialLinks: profile.socialLinks,
        areasServed: areasInput.split(',').map((s) => s.trim()).filter(Boolean),
        languages: languagesInput.split(',').map((s) => s.trim()).filter(Boolean),
        specializations: specializationsInput.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await updateMyAgentProfile(payload);
      setProfile(res.profile);
      toast.success('Profile Saved', 'Your business profile has been updated and persisted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update agent profile.';
      toast.error('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Agent Profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In to Edit Profile</h2>
        <button
          onClick={openAuthModal}
          className="mt-4 px-6 py-2.5 bg-casa-600 text-white rounded-xl font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  const profileSlug = profile.slug || `agent-${user?.id}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Agent Business Profile</h1>
            {profile.isVerifiedAgent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Badge Active
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure your professional public profile visible to buyers and property sellers across CASA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/agents/${profileSlug}`}
            target="_blank"
            className="inline-flex items-center px-4 py-2 bg-slate-50 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 border border-slate-200 transition"
          >
            <ExternalLink className="w-4 h-4 mr-1.5 text-slate-500" />
            View Public Page
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-casa-600" />
            Professional Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={profile.displayName || ''}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Title
              </label>
              <input
                type="text"
                value={profile.professionalTitle || ''}
                onChange={(e) => setProfile({ ...profile, professionalTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="e.g. Principal Property Consultant"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Agency / Firm Name
              </label>
              <input
                type="text"
                value={profile.agencyName || ''}
                onChange={(e) => setProfile({ ...profile, agencyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="e.g. Skyline Realty Advisors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.experienceYears ?? 0}
                onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                About / Professional Bio
              </label>
              <textarea
                rows={4}
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="Describe your background, market expertise, portfolio specialties, and commitment to clients..."
              />
            </div>
          </div>
        </div>

        {/* Contact & Links */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-casa-600" />
            Contact & Digital Channels
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Public Business Phone
              </label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Public Business Email
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="agent@agency.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="https://agency.com"
              />
            </div>
          </div>
        </div>

        {/* Location & Areas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-casa-600" />
            Office Location & Market Focus
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Office Street Address
              </label>
              <input
                type="text"
                value={profile.officeAddress?.address || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    officeAddress: { ...profile.officeAddress, address: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="Suite 402, Trade Tower"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                City / District
              </label>
              <input
                type="text"
                value={profile.officeAddress?.city || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    officeAddress: { ...profile.officeAddress, city: e.target.value, district: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="Lucknow"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                State
              </label>
              <input
                type="text"
                value={profile.officeAddress?.state || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    officeAddress: { ...profile.officeAddress, state: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="Uttar Pradesh"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                value={profile.officeAddress?.pincode || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    officeAddress: { ...profile.officeAddress, pincode: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="226010"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Areas Served (Comma-separated)
              </label>
              <input
                type="text"
                value={areasInput}
                onChange={(e) => setAreasInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="e.g. Gomti Nagar, Indira Nagar, Hazratganj, Sushant Golf City"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Languages Spoken (Comma-separated)
              </label>
              <input
                type="text"
                value={languagesInput}
                onChange={(e) => setLanguagesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="e.g. English, Hindi, Punjabi, Urdu"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Specializations (Comma-separated)
              </label>
              <input
                type="text"
                value={specializationsInput}
                onChange={(e) => setSpecializationsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-casa-500 focus:bg-white"
                placeholder="e.g. Luxury Villas, Commercial Office Spaces, Land Acquisition"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 bg-casa-600 text-white font-semibold rounded-xl hover:bg-casa-700 transition shadow-lg shadow-casa-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
