'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  Bell,
  Send,
  CheckCircle2,
  Phone,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCheck,
  Building,
  UserCheck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  AdminNotificationItem,
} from '@/services/notifications-service';

export default function NotificationsPage() {
  const toast = useToast();

  const [notifications, setNotifications] = React.useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'INQUIRY' | 'MODERATION' | 'KYC' | 'BILLING'>('ALL');
  const [search, setSearch] = React.useState('');
  const [isLiveActive, setIsLiveActive] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = React.useState(false);
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = React.useState(false);

  const prevIdsRef = React.useRef<Set<string>>(new Set());
  const isFirstLoadRef = React.useRef(true);

  // Play subtle chime using Web Audio API on new incoming notifications
  const playChime = React.useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  const loadNotifications = React.useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const res = await getAdminNotifications({ limit: 50 });
        const items = res.data || [];
        setNotifications(items);
        setUnreadCount(res.unreadCount);

        // Check if new notifications arrived after initial load
        if (!isFirstLoadRef.current && isBackground) {
          const currentIds = new Set(items.map((i) => i.id));
          const newItems = items.filter((i) => !prevIdsRef.current.has(i.id));

          if (newItems.length > 0) {
            playChime();
            const newest = newItems[0];
            toast.info(
              `🔔 New ${newest.badgeLabel || 'Alert'}`,
              `${newest.title} — ${newest.senderName || 'Just now'}`,
            );
          }
          prevIdsRef.current = currentIds;
        } else {
          prevIdsRef.current = new Set(items.map((i) => i.id));
          isFirstLoadRef.current = false;
        }
      } catch (err: any) {
        if (!isBackground) {
          toast.error('Sync Error', err.message || 'Failed to load notifications');
        }
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    },
    [playChime, toast],
  );

  // Initial load
  React.useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  // Real-time polling every 4 seconds when active and tab visible
  React.useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadNotifications(true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveActive, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All Read', 'All notifications marked as read.');
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsSendingBroadcast(true);
    setTimeout(() => {
      setIsSendingBroadcast(false);
      setIsBroadcastModalOpen(false);
      setBroadcastMessage('');
      toast.success('Broadcast Dispatched', 'Advisory transmitted to active operators and platform log.');
    }, 600);
  };

  const filtered = notifications.filter((n) => {
    if (activeTab !== 'ALL' && n.type !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.desc.toLowerCase().includes(q) ||
        (n.senderName && n.senderName.toLowerCase().includes(q)) ||
        (n.senderPhone && n.senderPhone.includes(q)) ||
        (n.propertyTitle && n.propertyTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return `${Math.max(1, diff)}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-casa-surface p-6 rounded-2xl border border-casa-border-light shadow-subtle">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-casa-brand-subtle text-casa-brand relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
                  Realtime Enquiry & Notification Hub
                </h1>
                {/* Live stream badge */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                    isLiveActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLiveActive ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'
                    }`}
                  />
                  <span>{isLiveActive ? 'Live Stream Active' : 'Polling Paused'}</span>
                </div>
              </div>
              <p className="text-xs md:text-sm text-casa-text-secondary mt-0.5">
                Real-time buyer inquiries, property moderation submissions, KYC reviews, and system alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
            className="p-2 rounded-xl border border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-casa-brand" /> : <VolumeX className="w-4 h-4 text-casa-text-muted" />}
          </button>

          {/* Toggle Live Stream */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            title={isLiveActive ? 'Pause real-time updates' : 'Resume real-time updates'}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              isLiveActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-casa-border-light text-casa-text-secondary hover:bg-casa-subtle'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse text-emerald-600' : ''}`} />
            <span>{isLiveActive ? 'Live' : 'Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadNotifications(false)}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark All Read
            </Button>
          )}

          {/* Broadcast Advisory */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="text-xs"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Broadcast SMS Advisory
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-casa-surface p-4 rounded-xl border border-casa-border-light shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All Alerts', count: notifications.length },
            { key: 'INQUIRY', label: 'Property Inquiries', count: notifications.filter((n) => n.type === 'INQUIRY').length },
            { key: 'MODERATION', label: 'Property Approvals', count: notifications.filter((n) => n.type === 'MODERATION').length },
            { key: 'KYC', label: 'Agent KYC', count: notifications.filter((n) => n.type === 'KYC').length },
            { key: 'BILLING', label: 'Subscriptions & Payments', count: notifications.filter((n) => n.type === 'BILLING').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-casa-brand text-white shadow-2xs'
                  : 'text-casa-text-secondary hover:bg-casa-canvas'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-casa-subtle text-casa-text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries by buyer, phone, property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary focus:outline-none focus:border-casa-brand"
          />
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-casa-text-muted bg-casa-surface rounded-2xl border border-casa-border-light">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-casa-brand" />
            Connecting to real-time notification gateway...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-casa-text-muted bg-casa-surface rounded-2xl border border-casa-border-light">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-casa-text-primary">No notifications found</p>
            <p className="text-xs text-casa-text-secondary mt-1">
              New property enquiries and system alerts will automatically appear here in real-time.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUnread = !item.isRead;
            const isLead = item.type === 'INQUIRY';

            return (
              <Card
                key={item.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  isUnread
                    ? 'bg-casa-surface border-casa-brand/40 shadow-subtle ring-1 ring-casa-brand/10'
                    : 'bg-casa-surface/80 border-casa-border-light hover:border-casa-border'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon by type */}
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        item.type === 'INQUIRY'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                          : item.type === 'MODERATION'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                          : item.type === 'KYC'
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                          : item.type === 'BILLING'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-casa-brand-subtle text-casa-brand'
                      }`}
                    >
                      {item.type === 'INQUIRY' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : item.type === 'MODERATION' ? (
                        <Building className="w-4 h-4" />
                      ) : item.type === 'KYC' ? (
                        <UserCheck className="w-4 h-4" />
                      ) : item.type === 'BILLING' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'INQUIRY'
                              ? 'bg-blue-100 text-blue-800'
                              : item.type === 'MODERATION'
                              ? 'bg-amber-100 text-amber-800'
                              : item.type === 'KYC'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.badgeLabel}
                        </span>

                        {isUnread && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            NEW
                          </span>
                        )}

                        <span className="text-[11px] text-casa-text-muted flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.time)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-casa-text-primary leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-casa-text-secondary leading-relaxed bg-casa-canvas p-2.5 rounded-xl border border-casa-border-light">
                        {item.desc}
                      </p>

                      {/* Sender details pill */}
                      {(item.senderName || item.senderPhone || item.propertyTitle) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-casa-text-muted pt-1">
                          {item.senderName && (
                            <span>
                              From: <strong className="text-casa-text-primary">{item.senderName}</strong>
                            </span>
                          )}
                          {item.senderPhone && (
                            <span className="flex items-center gap-1 text-casa-brand font-mono font-semibold">
                              <Phone className="w-3 h-3" /> {item.senderPhone}
                            </span>
                          )}
                          {item.propertyTitle && (
                            <span className="text-casa-text-secondary truncate max-w-xs">
                              Property: <em>{item.propertyTitle}</em>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0">
                    {/* Direct Call button for enquiries */}
                    {item.senderPhone && (
                      <a
                        href={`tel:${item.senderPhone}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}

                    {/* View Details link */}
                    {item.link && (
                      <Link
                        href={item.link}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-casa-subtle hover:bg-casa-canvas text-casa-text-primary border border-casa-border-light transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Mark Read Toggle */}
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        title="Mark as read"
                        className="p-1.5 rounded-xl text-casa-text-muted hover:text-emerald-600 hover:bg-casa-canvas transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
              <h3 className="text-base font-bold text-casa-text-primary">Broadcast SMS / Push Advisory</h3>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-casa-text-muted hover:text-casa-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-casa-text-secondary leading-relaxed">
              Transmit an emergency announcement or platform advisory message via active SMS gateway (MSG91) to registered buyers and verified operators.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-casa-text-primary mb-1">
                  Advisory Message Body
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter broadcast announcement text..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-3 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:border-casa-brand font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-casa-border-light">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSendingBroadcast || !broadcastMessage.trim()}
                  className="text-xs"
                >
                  {isSendingBroadcast ? 'Transmitting...' : 'Dispatch Advisory'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
