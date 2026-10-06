'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/theme-context';
import { useAdminAuth } from '@/contexts/auth-context';
import {
  LucideIcon,
  Building2,
  LayoutDashboard,
  Home,
  CheckSquare,
  Layers,
  MapPin,
  Users,
  UserCheck,
  User,
  MessageSquare,
  CreditCard,
  Receipt,
  FileText,
  Image as ImageIcon,
  Globe,
  Bell,
  Settings,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

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

export function AdminSidebar() {
  const pathname = usePathname();

  const navGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard, active: pathname === '/' },
      ],
    },
    {
      label: 'PROPERTY MANAGEMENT',
      items: [
        { label: 'All Properties', href: '/properties', icon: Home },
        { label: 'Pending Approvals', href: '/moderation', icon: CheckSquare, badge: '3' },
        { label: 'Categories', href: '/categories', icon: Layers },
        { label: 'Locations', href: '/locations', icon: MapPin },
      ],
    },
    {
      label: 'USER MANAGEMENT',
      items: [
        { label: 'All Users', href: '/users', icon: Users },
        { label: 'Agents & Verification', href: '/agents', icon: UserCheck },
        { label: 'Purchasers', href: '/purchasers', icon: User },
      ],
    },
    {
      label: 'BUSINESS MANAGEMENT',
      items: [
        { label: 'Enquiries & Leads', href: '/enquiries', icon: MessageSquare },
        { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
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
      label: 'SYSTEM & AUDIT',
      items: [
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-casa-surface border-r border-casa-border-light flex flex-col flex-shrink-0 min-h-screen transition-colors duration-200">
      {/* Brand Header */}
      <div className="h-16 border-b border-casa-border-light px-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-casa-brand flex items-center justify-center text-white font-bold shadow-subtle">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-casa-text-primary block leading-none">
              CASA Admin
            </span>
            <span className="text-[10px] text-casa-text-muted font-medium uppercase tracking-wider">
              Governance Portal
            </span>
          </div>
        </Link>
        <span className="text-[10px] bg-casa-brand-subtle text-casa-brand font-bold px-1.5 py-0.5 rounded-md">
          v1.0
        </span>
      </div>

      {/* Navigation Groups */}
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
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        item.active
                          ? 'bg-casa-brand text-white shadow-subtle font-semibold'
                          : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
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

      {/* Public Marketplace Quick Link */}
      <div className="p-4 border-t border-casa-border-light bg-casa-canvas/50">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-xs text-casa-brand hover:underline font-semibold"
        >
          <span>View Public Marketplace</span>
          <span>↗</span>
        </a>
      </div>
    </aside>
  );
}

export function AdminHeader() {
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
    <header className="h-16 bg-casa-surface border-b border-casa-border-light px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <h1 className="text-sm md:text-base font-bold text-casa-text-primary">
          Operations & Moderation Dashboard
        </h1>
        <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
          ● Operator Active
        </span>
      </div>

      <div className="flex items-center gap-3">
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
        <div className="text-xs text-casa-text-muted hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-casa-canvas border border-casa-border-light">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Gateway: :5000</span>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2.5 ps-2 border-s border-casa-border-light">
          <div className="w-8 h-8 rounded-full bg-casa-brand text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {userInitials}
          </div>
          <div className="hidden lg:block text-start">
            <span className="text-xs font-bold text-casa-text-primary block leading-none">
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
