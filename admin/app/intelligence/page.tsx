'use client';

import * as React from 'react';
import {
  AdminIntelligenceService,
  OperationsOverview,
  FunnelIntelligence,
  PricingIntelligence,
} from '@/services/intelligence-service';
import {
  BarChart3,
  TrendingUp,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Users,
  Building,
  CheckCircle,
} from 'lucide-react';

export default function AdminIntelligencePage() {
  const [overview, setOverview] = React.useState<OperationsOverview | null>(null);
  const [funnel, setFunnel] = React.useState<FunnelIntelligence | null>(null);
  const [pricing, setPricing] = React.useState<PricingIntelligence | null>(null);
  const [selectedCity, setSelectedCity] = React.useState('Lucknow');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('casa_admin_token') || '' : '';
      const [ov, fn, pr] = await Promise.all([
        AdminIntelligenceService.getOperationsOverview(token),
        AdminIntelligenceService.getConversionFunnel(token),
        AdminIntelligenceService.getPricingIntelligence(selectedCity),
      ]);
      setOverview(ov);
      setFunnel(fn);
      setPricing(pr);
      setLoading(false);
    }
    loadData();
  }, [selectedCity]);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Marketplace Intelligence & Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            Operational Excellence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time pipeline automation, conversion drop-off funnels, and algorithmic market pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Lucknow">Lucknow Market</option>
            <option value="Mumbai">Mumbai Market</option>
            <option value="Ahmedabad">Ahmedabad Market</option>
            <option value="Pune">Pune Market</option>
          </select>
        </div>
      </div>

      {/* Operational Queues Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <Building className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {loading ? '...' : overview?.operationalQueues.pendingPropertyApprovals ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Unapproved listings awaiting governance review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Agent Verifications
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {loading ? '...' : overview?.operationalQueues.pendingAgentVerifications ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Agents in identity & RERA approval queue</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Paid Boosts
            </span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {loading ? '...' : overview?.operationalQueues.activePaidPromotions ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Listings currently promoted on search & home</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Automated Tasks Due
            </span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {loading ? '...' : overview?.operationalQueues.pendingFollowUpTasks ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Scheduled lead follow-ups and action triggers</p>
        </div>
      </div>

      {/* Conversion Funnel & Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Marketplace Conversion Funnel */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Marketplace Conversion Funnel</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Visitor drop-off analysis from initial property discovery to recorded conversion.
            </p>
          </div>

          <div className="space-y-4">
            {funnel?.stages.map((st, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{st.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{st.count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, 100 - st.dropOffPercentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="text-[10px] text-gray-500">View $\rightarrow$ Enquiry</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                {funnel?.metrics.viewToEnquiryRate || '0%'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="text-[10px] text-gray-500">Enquiry $\rightarrow$ Visit</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                {funnel?.metrics.enquiryToVisitRate || '0%'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="text-[10px] text-gray-500">Visit $\rightarrow$ Conversion</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                {funnel?.metrics.visitToConversionRate || '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Intelligence Widget */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Pricing Intelligence — {selectedCity}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Aggregated benchmark metrics across verified active inventory.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 space-y-1">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">Average Price</span>
              <div className="text-lg font-black text-gray-900 dark:text-white">
                ₹{pricing?.averagePrice ? pricing.averagePrice.toLocaleString() : '0'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 space-y-1">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">Estimated Price / Sq.Ft</span>
              <div className="text-lg font-black text-gray-900 dark:text-white">
                ₹{pricing?.estimatedPricePerSqFt ? pricing.estimatedPricePerSqFt.toLocaleString() : '0'}
              </div>
            </div>
          </div>

          {/* Price Distribution */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Price Tier Distribution</span>
            <div className="space-y-2">
              {pricing?.priceDistribution.map((dist, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{dist.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${dist.percentage}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 w-8 text-right">
                      {dist.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
            {pricing?.disclaimer || 'CASA Marketplace Data — Aggregated based on active listings.'}
          </div>
        </div>
      </div>
    </div>
  );
}
