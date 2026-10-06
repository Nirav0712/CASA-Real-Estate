'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { EngagementService, NotificationItem } from '@/services/engagement-service';
import { Container, Card, Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, RefreshCw, Sparkles, MessageSquare, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterUnread, setFilterUnread] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await EngagementService.getNotifications();
      if (res.data) {
        let items = res.data;
        if (filterUnread) {
          items = items.filter((n) => !n.isRead);
        }
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.isRead).length);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [filterUnread]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await EngagementService.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await EngagementService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err: any) {
      toast.error('Action failed', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await EngagementService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.info('Notification removed');
    } catch (err: any) {
      toast.error('Action failed', err.message);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SEARCH_ALERT':
        return <Sparkles className="w-4 h-4 text-casa-brand" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'SITE_VISIT_REQUESTED':
      case 'SITE_VISIT_CONFIRMED':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'PROPERTY_APPROVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-casa-text-muted" />;
    }
  };

  return (
    <div className="min-h-screen bg-casa-canvas py-8">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-casa-text-primary">
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-casa-brand text-white text-xs font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-xs text-casa-text-secondary mt-0.5">
              Stay updated on matched searches, new enquiries, site visits, and direct messages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs flex items-center gap-1.5 border-zinc-300 dark:border-zinc-700"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              className="text-xs flex items-center gap-1.5 border-zinc-300 dark:border-zinc-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !filterUnread
                ? 'bg-casa-brand text-white shadow-xs'
                : 'bg-casa-surface text-casa-text-secondary hover:text-casa-text-primary border border-casa-border-light'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterUnread
                ? 'bg-casa-brand text-white shadow-xs'
                : 'bg-casa-surface text-casa-text-secondary hover:text-casa-text-primary border border-casa-border-light'
            }`}
          >
            Unread Only
          </button>
        </div>

        {/* Notification List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-casa-surface rounded-2xl border border-casa-border animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-casa-surface border border-dashed border-casa-border-light rounded-2xl">
            <Bell className="w-12 h-12 text-casa-text-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-casa-text-primary">No notifications</h3>
            <p className="text-xs text-casa-text-secondary max-w-sm mx-auto mt-1">
              You are all caught up! Search alerts, new leads, and chat messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <Card
                key={item._id}
                className={`p-4 border-casa-border-light transition-all flex items-start justify-between gap-4 ${
                  !item.isRead ? 'bg-casa-brand/5 dark:bg-casa-brand/10 border-s-4 border-s-casa-brand' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-casa-surface border border-casa-border-light flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-bold text-xs text-casa-text-primary truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-casa-text-muted flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-casa-text-secondary leading-relaxed">
                      {item.message}
                    </p>

                    {item.data?.propertySlug && (
                      <Link
                        href={`/property/${item.data.propertySlug}`}
                        className="inline-flex items-center gap-1 text-[11px] text-casa-brand font-semibold hover:underline pt-1"
                      >
                        <span>View Property Listing</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkRead(item._id)}
                      title="Mark as read"
                      className="p-1.5 text-casa-text-muted hover:text-casa-brand transition-colors rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item._id)}
                    title="Delete notification"
                    className="p-1.5 text-casa-text-muted hover:text-rose-500 transition-colors rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
