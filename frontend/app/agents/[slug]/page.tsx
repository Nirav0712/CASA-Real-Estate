'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPublicAgentProfile, PublicAgentDetailResponse } from '@/services/agent-service';
import { createLead } from '@/services/lead-service';
import { useToast } from '@/contexts/toast-context';
import { formatPrice } from '@/lib/utils';
import {
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Award,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function PublicAgentProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const toast = useToast();

  const [agentData, setAgentData] = React.useState<PublicAgentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Direct Agent Enquiry Form
  const [leadForm, setLeadForm] = React.useState({
    name: '',
    mobile: '',
    email: '',
    message: 'Hello, I would like to consult with you regarding property buying/leasing options.',
  });
  const [isSubmittingLead, setIsSubmittingLead] = React.useState(false);
  const [leadSubmitted, setLeadSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    async function loadAgent() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublicAgentProfile(slug);
        setAgentData(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Agent not found.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadAgent();
  }, [slug]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentData?.listings || agentData.listings.length === 0) {
      toast.info('Agent Enquiry', 'Please contact the agent directly via phone or email.');
      return;
    }
    const targetPropertyId = agentData.listings[0].id;
    setIsSubmittingLead(true);
    try {
      await createLead({
        propertyId: targetPropertyId,
        name: leadForm.name,
        mobile: leadForm.mobile,
        email: leadForm.email || undefined,
        message: leadForm.message,
        source: 'DIRECT',
      });
      setLeadSubmitted(true);
      toast.success('Inquiry Sent', 'Your consultation request has been forwarded directly to the agent.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit inquiry.';
      toast.error('Inquiry Failed', msg);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-casa-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Agent Profile...</p>
      </div>
    );
  }

  if (error || !agentData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Profile Not Found</h2>
        <p className="text-slate-600 max-w-md mb-6">
          The requested real estate consultant profile may be inactive or unavailable.
        </p>
        <Link
          href="/properties"
          className="px-6 py-2.5 bg-casa-600 text-white rounded-xl font-medium"
        >
          Explore Properties
        </Link>
      </div>
    );
  }

  const { agent, listings, stats } = agentData;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Agent Profile Hero Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-casa-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md shrink-0">
                {agent.displayName ? agent.displayName[0].toUpperCase() : 'A'}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{agent.displayName}</h1>
                  {agent.isVerifiedAgent && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                      CASA VERIFIED AGENT
                    </span>
                  )}
                </div>

                <p className="text-base font-semibold text-casa-600">
                  {agent.professionalTitle || 'Real Estate Consultant'}
                  {agent.agencyName && ` • ${agent.agencyName}`}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  {agent.officeAddress?.city && (
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {agent.officeAddress.city}, {agent.officeAddress.state}
                    </span>
                  )}
                  {stats.experienceYears > 0 && (
                    <span className="flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {stats.experienceYears}+ Years Experience
                    </span>
                  )}
                  {agent.reraNumber && (
                    <span className="flex items-center font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      RERA: {agent.reraNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex flex-wrap gap-3 self-stretch md:self-auto justify-end">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="inline-flex items-center px-5 py-2.5 bg-casa-600 hover:bg-casa-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  <Phone className="w-4 h-4 mr-1.5" /> Call Agent
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  <Mail className="w-4 h-4 mr-1.5" /> Email
                </a>
              )}
            </div>
          </div>

          {/* Bio & Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pt-8 border-t border-slate-100">
            {/* Left 2 Cols: Bio & Specs */}
            <div className="lg:col-span-2 space-y-6">
              {agent.bio && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">About</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{agent.bio}</p>
                </div>
              )}

              {/* Areas & Specializations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {agent.areasServed && agent.areasServed.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Areas Served</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.areasServed.map((area, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {agent.specializations && agent.specializations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specializations</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.specializations.map((spec, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-casa-50 text-casa-700 rounded-lg text-xs font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Consultation Form */}
            <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Direct Consultation Request</h3>
                <p className="text-xs text-slate-500">Contact {agent.displayName} directly for property advisory.</p>
              </div>

              {leadSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">Request Dispatched!</p>
                  <p className="text-[11px] text-emerald-700">The agent has received your contact details and message.</p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="e.g. Vikram Verma"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={leadForm.mobile}
                      onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      rows={2}
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full py-2.5 bg-casa-600 hover:bg-casa-700 text-white font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingLead ? 'Sending Request...' : 'Send Consultation Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Agent Active Published Listings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Active Listings by {agent.displayName}
              </h2>
              <p className="text-xs text-slate-500">
                Verified and published inventory directly represented by this agent ({listings.length} properties)
              </p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No active listings available</h3>
              <p className="text-xs text-slate-500 mt-1">
                This agent does not have any currently published properties in the marketplace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/property/${prop.slug}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-casa-200 transition group flex flex-col justify-between"
                >
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-casa-50 text-casa-700">
                        {prop.listingType}
                      </span>
                      <span className="text-xs text-slate-500">{prop.category}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-casa-600 transition">
                      {typeof prop.title === 'string' ? prop.title : prop.title.en}
                    </h3>

                    <p className="text-lg font-extrabold text-casa-600">
                      {formatPrice(prop.price.amount)}
                    </p>

                    <div className="flex items-center text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {prop.location?.locality ? `${prop.location.locality}, ` : ''}
                        {prop.location?.city}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>View Property Details</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-casa-600 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
