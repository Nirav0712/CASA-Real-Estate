'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { EngagementService, SavedSearch } from '@/services/engagement-service';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  ExternalLink,
  Plus,
  SlidersHorizontal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SavedSearchesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [searches, setSearches] = React.useState<SavedSearch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const fetchSearches = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await EngagementService.getSavedSearches();
      if (res.success && res.data) {
        setSearches(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load saved searches', err.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    if (isAuthenticated) {
      fetchSearches();
    }
  }, [authLoading, isAuthenticated, router, fetchSearches]);

  const handleToggleAlerts = async (search: SavedSearch) => {
    try {
      setTogglingId(search._id);
      const updatedAlerts = !search.alertsEnabled;
      const res = await EngagementService.updateSavedSearch(search._id, {
        alertsEnabled: updatedAlerts,
      });
      if (res.success) {
        setSearches((prev) =>
          prev.map((s) => (s._id === search._id ? { ...s, alertsEnabled: updatedAlerts } : s))
        );
        toast.success(
          updatedAlerts ? 'Alerts Activated' : 'Alerts Paused',
          updatedAlerts
            ? 'You will receive instant notifications when matching properties are listed.'
            : 'Notifications for this search have been turned off.'
        );
      }
    } catch (err: any) {
      toast.error('Error updating alerts', err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;
    try {
      const res = await EngagementService.deleteSavedSearch(id);
      if (res.success) {
        setSearches((prev) => prev.filter((s) => s._id !== id));
        toast.success('Search deleted', 'Saved search removed successfully.');
      }
    } catch (err: any) {
      toast.error('Failed to delete', err.message);
    }
  };

  const buildSearchUrl = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.keyword) params.append('q', search.keyword);
    if (search.filters?.purpose) params.append('purpose', search.filters.purpose);
    if (search.filters?.type) params.append('type', search.filters.type);
    if (search.filters?.minPrice) params.append('minPrice', String(search.filters.minPrice));
    if (search.filters?.maxPrice) params.append('maxPrice', String(search.filters.maxPrice));
    if (search.filters?.bedrooms) params.append('bedrooms', String(search.filters.bedrooms));
    if (search.filters?.city) params.append('city', search.filters.city);
    return `/properties?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-casa-canvas py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-casa-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-casa-text-primary flex items-center gap-2.5">
            <Search className="w-7 h-7 text-casa-brand" />
            Saved Searches & Alerts
          </h1>
          <p className="mt-1 text-sm text-casa-text-secondary">
            Save your frequent filters and receive real-time notifications as new matching properties are published.
          </p>
        </div>

        <Link href="/properties">
          <Button className="bg-casa-brand hover:bg-casa-brand-hover text-white flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Explore Properties</span>
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl bg-casa-surface border border-casa-border animate-pulse"
              />
            ))}
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-16 px-4 bg-casa-surface border border-dashed border-casa-border rounded-2xl">
            <div className="w-14 h-14 bg-casa-brand/10 text-casa-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-casa-text-primary">No saved searches yet</h3>
            <p className="text-sm text-casa-text-secondary max-w-md mx-auto mt-1 mb-6">
              When searching for properties on CASA, save your search criteria with alert notifications to never miss your dream listing.
            </p>
            <Link href="/properties">
              <Button className="bg-casa-brand text-white hover:bg-casa-brand-hover">
                Search Properties Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searches.map((search) => {
              const url = buildSearchUrl(search);
              return (
                <div
                  key={search._id}
                  className="bg-casa-surface rounded-2xl border border-casa-border p-5 hover:border-casa-brand/40 transition-all flex flex-col justify-between shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="font-semibold text-casa-text-primary group-hover:text-casa-brand transition-colors text-base line-clamp-1">
                        {search.name || search.keyword || 'Custom Search'}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          search.alertsEnabled
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {search.alertsEnabled ? (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Alerts Active
                          </>
                        ) : (
                          'Alerts Off'
                        )}
                      </span>
                    </div>

                    {/* Filter Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {search.keyword && (
                        <span className="text-xs bg-casa-canvas text-casa-text-secondary px-2 py-0.5 rounded-md border border-casa-border">
                          Keyword: {search.keyword}
                        </span>
                      )}
                      {search.filters?.purpose && (
                        <span className="text-xs bg-casa-canvas text-casa-text-secondary px-2 py-0.5 rounded-md border border-casa-border">
                          {search.filters.purpose}
                        </span>
                      )}
                      {search.filters?.type && (
                        <span className="text-xs bg-casa-canvas text-casa-text-secondary px-2 py-0.5 rounded-md border border-casa-border">
                          {search.filters.type}
                        </span>
                      )}
                      {search.filters?.city && (
                        <span className="text-xs bg-casa-canvas text-casa-text-secondary px-2 py-0.5 rounded-md border border-casa-border">
                          City: {search.filters.city}
                        </span>
                      )}
                      {search.filters?.bedrooms && (
                        <span className="text-xs bg-casa-canvas text-casa-text-secondary px-2 py-0.5 rounded-md border border-casa-border">
                          {search.filters.bedrooms} BHK
                        </span>
                      )}
                      {(search.filters?.minPrice || search.filters?.maxPrice) && (
                        <span className="text-xs bg-casa-canvas text-casa-text-secondary px-2 py-0.5 rounded-md border border-casa-border">
                          ₹{search.filters.minPrice?.toLocaleString() || 0} - ₹{search.filters.maxPrice?.toLocaleString() || 'Max'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-casa-border flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAlerts(search)}
                      disabled={togglingId === search._id}
                      className="text-xs flex items-center gap-1.5 h-8"
                    >
                      {search.alertsEnabled ? (
                        <>
                          <BellOff className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Pause Alert</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5 text-casa-brand" />
                          <span>Enable Alert</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Link href={url}>
                        <Button
                          size="sm"
                          className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs h-8 flex items-center gap-1 px-2.5"
                        >
                          <span>Run</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(search._id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
