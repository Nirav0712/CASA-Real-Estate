'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/theme-context';
import { useAdminAuth } from '@/contexts/auth-context';
import { Logo } from '@/components/ui/logo';
import {
  LucideIcon,
  Building2,
  LayoutDashboard,
  BarChart3,
  Home,
  CheckSquare,
  Layers,
  MapPin,
  Users,
  UserCheck,
  User,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  Receipt,
  FileText,
  Image as ImageIcon,
  Globe,
  Bell,
  Settings,
  ShieldAlert,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  Video,
  Menu,
  X,
  Star,
  Search,
} from 'lucide-react';
import { getPendingModerationQueue } from '@/services/admin-service';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ isMobileOpen = false, onMobileClose }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = React.useState<number>(0);

  // Close mobile drawer on route changes
  React.useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchPending = () => {
      getPendingModerationQueue()
        .then((res) => {
          if (isMounted) {
            setPendingCount(res.queue?.length ?? 0);
          }
        })
        .catch(() => {
          if (isMounted) setPendingCount(0);
        });
    };
    fetchPending();
    window.addEventListener('casa_pending_updated', fetchPending);
    return () => {
      isMounted = false;
      window.removeEventListener('casa_pending_updated', fetchPending);
    };
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard, active: pathname === '/' },
        { label: 'BI Analytics', href: '/analytics', icon: BarChart3, active: pathname === '/analytics' },
        { label: 'Market Intelligence', href: '/intelligence', icon: Layers, active: pathname === '/intelligence' },
      ],
    },
    {
      label: 'PROPERTY MANAGEMENT',
      items: [
        { label: 'All Properties', href: '/properties', icon: Home, active: pathname === '/properties' },
        { label: 'Featured Requests', href: '/properties/featured-requests', icon: Star, active: pathname?.startsWith('/properties/featured-requests') },
        { label: '9:16 Video Reels', href: '/reels', icon: Video, active: pathname?.startsWith('/reels') },
        {
          label: 'Pending Approvals',
          href: '/moderation',
          icon: CheckSquare,
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
          active: pathname?.startsWith('/moderation'),
        },
        { label: 'Property Reports', href: '/reports', icon: ShieldAlert, active: pathname?.startsWith('/reports') },
        { label: 'Categories', href: '/categories', icon: Layers, active: pathname?.startsWith('/categories') },
      ],
    },
    {
      label: 'USER MANAGEMENT',
      items: [
        { label: 'All Users', href: '/users', icon: Users, active: pathname?.startsWith('/users') },
        { label: 'KYC & Verification', href: '/kyc', icon: ShieldCheck, active: pathname?.startsWith('/kyc') },
        { label: 'Agents & Badges', href: '/agents', icon: UserCheck, active: pathname?.startsWith('/agents') },
        { label: 'Purchasers', href: '/purchasers', icon: User, active: pathname?.startsWith('/purchasers') },
      ],
    },
    {
      label: 'BUSINESS MANAGEMENT',
      items: [
        { label: 'Enquiries & Leads', href: '/enquiries', icon: MessageSquare },
        { label: 'Customer Reviews', href: '/reviews', icon: FileText },
        { label: 'Payments & Invoices', href: '/payments', icon: Receipt },
      ],
    },
    {
      label: 'CONTENT MANAGEMENT',
      items: [
        { label: 'Pages & Content', href: '/content', icon: FileText },
        { label: 'Media Library', href: '/media', icon: ImageIcon },
        { label: 'Languages', href: '/languages', icon: Globe },
      ],
    },
    {
      label: 'SEO & SEARCH ENGINE',
      items: [
        { label: 'SEO Command Hub', href: '/seo', icon: Search, active: pathname?.startsWith('/seo') },
      ],
    },
    {
      label: 'ACCESS & ENTITLEMENTS',
      items: [
        { label: 'Role Management', href: '/roles', icon: ShieldAlert, active: pathname?.startsWith('/roles') },
        { label: 'Permissions Catalog', href: '/permissions', icon: CheckSquare, active: pathname === '/permissions' },
        { label: 'Packages & Limits', href: '/packages', icon: CreditCard, active: pathname?.startsWith('/packages') },
        { label: 'Entitlement Usage', href: '/usage', icon: BarChart3, active: pathname === '/usage' },
      ],
    },
    {
      label: 'SYSTEM & AUDIT',
      items: [
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Fraud & Risk Flags', href: '/risk', icon: AlertTriangle, active: pathname === '/risk' },
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 text-start">
      {navGroups.map((group) => (
        <div key={group.label}>
          <span className="text-[10px] font-bold text-casa-text-muted tracking-wider uppercase block px-2 mb-2 select-none">
            {group.label}
          </span>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => onMobileClose?.()}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      item.active
                        ? 'bg-casa-brand text-white shadow-subtle font-semibold'
                        : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          item.active
                            ? 'bg-white text-casa-brand'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="w-64 bg-casa-surface border-r border-casa-border-light flex-col flex-shrink-0 min-h-screen sticky top-0 h-screen transition-colors duration-200 hidden lg:flex">
        {/* Brand Header */}
        <div className="h-16 border-b border-casa-border-light px-4 flex items-center justify-between shrink-0">
          <Logo size="md" height={38} href="/" />
          <span className="text-[10px] bg-casa-brand-subtle text-casa-brand font-bold px-1.5 py-0.5 rounded-md">
            v1.0
          </span>
        </div>

        {/* Navigation Groups */}
        {renderNavContent()}

        {/* Public Marketplace Quick Link */}
        <div className="p-4 border-t border-casa-border-light bg-casa-canvas/50 shrink-0">
          <a
            href={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs text-casa-brand hover:underline font-semibold"
          >
            <span>View Public Marketplace</span>
            <span>↗</span>
          </a>
        </div>
      </aside>

      {/* 2. Mobile / Tablet Overlay Backdrop (< 1024px) */}
      <div
        className={`fixed inset-0 bg-casa-overlay/60 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* 3. Mobile / Tablet Slide-Over Drawer (< 1024px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-casa-surface border-r border-casa-border-light flex flex-col shadow-elevated transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation Sidebar"
      >
        {/* Mobile Header with Close Button */}
        <div className="h-16 border-b border-casa-border-light px-4 flex items-center justify-between shrink-0">
          <Logo size="md" height={36} href="/" />
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-xl text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        {renderNavContent()}

        {/* Public Marketplace Quick Link */}
        <div className="p-4 border-t border-casa-border-light bg-casa-canvas/50 shrink-0">
          <a
            href={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMobileClose}
            className="flex items-center justify-between text-xs text-casa-brand hover:underline font-semibold"
          >
            <span>View Public Marketplace</span>
            <span>↗</span>
          </a>
        </div>
      </aside>
    </>
  );
}

export interface AdminHeaderProps {
  onToggleMobileNav?: () => void;
}

export function AdminHeader({ onToggleMobileNav }: AdminHeaderProps = {}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { adminUser, logout } = useAdminAuth();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const userInitials = adminUser?.name
    ? adminUser.name.substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="h-16 bg-casa-surface border-b border-casa-border-light px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Open navigation menu"
          className="p-2 -ml-1 sm:ml-0 rounded-xl text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle border border-casa-border-light lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xs sm:text-sm md:text-base font-bold text-casa-text-primary truncate max-w-[170px] xs:max-w-[220px] sm:max-w-none">
          Operations & Moderation Dashboard
        </h1>

        <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold shrink-0">
          ● Operator Active
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="p-2 text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle rounded-xl transition-colors cursor-pointer"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-sky-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Backend Status Indicator */}
        <div className="text-xs text-casa-text-muted hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-casa-canvas border border-casa-border-light">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Gateway: :5000</span>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2 ps-1.5 sm:ps-2 border-s border-casa-border-light">
          <div className="w-8 h-8 rounded-full bg-casa-brand text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
            {userInitials}
          </div>
          <div className="hidden md:block text-start">
            <span className="text-xs font-bold text-casa-text-primary block leading-none truncate max-w-[120px]">
              {adminUser?.name || 'Administrator'}
            </span>
            <span className="text-[10px] text-casa-brand font-medium uppercase">
              {adminUser?.role?.replace('_', ' ') || 'SUPER ADMIN'}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign Out of Admin Portal"
            className="p-1.5 text-casa-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
