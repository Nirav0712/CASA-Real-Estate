'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnalyticsAdminService, AdminBIMetrics } from '@/services/analytics-service';
import {
  BarChart3,
  Users,
  Building,
  TrendingUp,
  Receipt,
  MapPin,
  ShieldAlert,
  Calendar,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminAnalyticsBIPage() {
  const [metrics, setMetrics] = React.useState<AdminBIMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadBI = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await AnalyticsAdminService.getMarketplaceBI();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBI();
  }, [loadBI]);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-casa-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-casa-text-primary flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-casa-brand" />
            Marketplace Business Intelligence & Analytics
          </h1>
          <p className="text-xs text-casa-text-secondary mt-1">
            Real-time aggregate telemetry across users, listings, leads, revenue, location dynamics, and conversion funnels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadBI}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {loading || !metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-32 bg-casa-surface rounded-2xl border border-casa-border-light animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Top High-Level KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light flex flex-col justify-between shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-casa-text-muted">Total Registered Users</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-casa-text-primary">
                  {metrics.users.total.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  +{metrics.users.newThisMonth} new this month
                </div>
              </div>
            </div>

            {/* Live Properties */}
            <div className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light flex flex-col justify-between shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-casa-text-muted">Active Properties</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-casa-text-primary">
                  {metrics.properties.published.toLocaleString()}
                </div>
                <div className="text-[11px] text-casa-text-muted mt-1">
                  {metrics.properties.total} total listings ({metrics.properties.pending} in review)
                </div>
              </div>
            </div>

            {/* Lead Conversion */}
            <div className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light flex flex-col justify-between shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-casa-text-muted">Conversion Rate</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-casa-text-primary">
                  {metrics.leads.conversionRate}%
                </div>
                <div className="text-[11px] text-casa-text-muted mt-1">
                  {metrics.leads.converted} of {metrics.leads.total} leads converted
                </div>
              </div>
            </div>

            {/* Total Monetization */}
            <div className="bg-casa-surface p-5 rounded-2xl border border-casa-border-light flex flex-col justify-between shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-casa-text-muted">Platform Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-casa-brand">
                  ₹{metrics.revenue.totalAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-casa-text-muted mt-1">
                  {metrics.revenue.totalOrders} paid transactions
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Viewed Properties Table */}
            <div className="bg-casa-surface p-6 rounded-2xl border border-casa-border-light space-y-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-casa-brand" />
                    <span>Most Viewed Property Listings</span>
                  </h2>
                  <p className="text-[11px] text-casa-text-muted mt-0.5">
                    Real-time buyer engagement telemetry
                  </p>
                </div>
                <Link href="/properties" className="text-xs text-casa-brand hover:underline font-semibold">
                  All Properties →
                </Link>
              </div>

              {metrics.properties.topViewed.length === 0 ? (
                <div className="text-center py-8 text-xs text-casa-text-muted">
                  No property view records logged yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.properties.topViewed.map((item, idx) => (
                    <div
                      key={item._id}
                      className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-full bg-casa-surface font-bold text-[10px] text-casa-text-muted flex items-center justify-center flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-casa-text-primary truncate">
                          {typeof item.title === 'string' ? item.title : item.title?.en || 'Listing'}
                        </span>
                      </div>
                      <span className="font-bold text-casa-brand px-2 py-0.5 bg-casa-brand/10 rounded flex-shrink-0">
                        {item.views} Views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Distribution */}
            <div className="bg-casa-surface p-6 rounded-2xl border border-casa-border-light space-y-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Top Geographic Hubs</span>
                  </h2>
                  <p className="text-[11px] text-casa-text-muted mt-0.5">
                    Listing density and city concentration
                  </p>
                </div>
                <Link href="/locations" className="text-xs text-casa-brand hover:underline font-semibold">
                  Locations →
                </Link>
              </div>

              {metrics.locations.topCities.length === 0 ? (
                <div className="text-center py-8 text-xs text-casa-text-muted">
                  No geographic distribution recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {metrics.locations.topCities.map((city) => (
                    <div
                      key={city._id || 'Unknown'}
                      className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-casa-text-primary capitalize truncate">
                        {city._id || 'Unspecified'}
                      </span>
                      <span className="font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded">
                        {city.count} Listings
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversion Funnel & Risk Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversion Journey */}
            <div className="lg:col-span-2 bg-casa-surface p-6 rounded-2xl border border-casa-border-light space-y-4 shadow-subtle">
              <h2 className="text-sm font-bold text-casa-text-primary flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-casa-brand" />
                <span>End-to-End User Conversion Pipeline</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-casa-canvas rounded-xl border border-casa-border-light">
                  <span className="text-[10px] font-bold text-casa-text-muted uppercase">Inquiries</span>
                  <div className="text-lg font-bold text-casa-text-primary mt-1">{metrics.leads.total}</div>
                </div>

                <div className="p-3.5 bg-casa-canvas rounded-xl border border-casa-border-light">
                  <span className="text-[10px] font-bold text-casa-text-muted uppercase">Site Visits</span>
                  <div className="text-lg font-bold text-casa-text-primary mt-1">{metrics.leads.siteVisits}</div>
                </div>

                <div className="p-3.5 bg-casa-canvas rounded-xl border border-casa-border-light">
                  <span className="text-[10px] font-bold text-casa-text-muted uppercase">Visits Completed</span>
                  <div className="text-lg font-bold text-casa-text-primary mt-1">{metrics.leads.completedVisits}</div>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Converted</span>
                  <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mt-1">{metrics.leads.converted}</div>
                </div>
              </div>
            </div>

            {/* Risk & Trust Overview Card */}
            <div className="bg-gradient-to-br from-rose-50/70 to-casa-surface dark:from-rose-950/20 dark:to-casa-surface p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between shadow-subtle">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-sm text-casa-text-primary">Fraud & Abuse Monitor</h3>
                </div>
                <p className="text-xs text-casa-text-secondary leading-relaxed">
                  Active risk flags detecting duplicate listings, pricing anomalies, and suspicious seller accounts.
                </p>
                <div className="text-2xl font-extrabold text-rose-600 pt-2">
                  {metrics.risk.openFlags} Open Alerts
                </div>
              </div>

              <Link href="/risk" className="mt-4">
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 flex items-center justify-center gap-1.5 shadow-xs">
                  <span>Manage Risk Flags</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
