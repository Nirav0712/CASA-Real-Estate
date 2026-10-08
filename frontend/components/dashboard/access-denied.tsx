'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowLeft, RefreshCw, LayoutDashboard } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  moduleName?: string;
  requiredPermission?: string;
  description?: string;
  onRefresh?: () => void;
  returnHref?: string;
  returnLabel?: string;
}

export function AccessDenied({
  title = 'Access Denied',
  moduleName = 'this section',
  requiredPermission,
  description,
  onRefresh,
  returnHref = '/dashboard',
  returnLabel = 'Back to Dashboard',
}: AccessDeniedProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-8 sm:p-12 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Icon Badge */}
          <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" /> Insufficient Permissions
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            {title}
          </h1>

          <p className="text-slate-600 max-w-lg mb-6 leading-relaxed">
            {description || (
              <>
                Your current account role does not have permission to view or manage{' '}
                <span className="font-semibold text-slate-800">{moduleName}</span>.
                {requiredPermission && (
                  <span className="block mt-2 font-mono text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                    Required: {requiredPermission}
                  </span>
                )}
              </>
            )}
          </p>

          <p className="text-xs text-slate-500 max-w-md mb-8">
            If you believe you should have access to this feature, please contact your organization administrator or CASA support to update your role permissions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={returnHref}
              className="inline-flex items-center gap-2 px-6 py-3 bg-casa-600 hover:bg-casa-700 text-white font-medium rounded-xl transition shadow-lg shadow-casa-600/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              {returnLabel}
            </Link>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Recheck Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
