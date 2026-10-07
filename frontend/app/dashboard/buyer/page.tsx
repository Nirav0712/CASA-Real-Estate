'use client';

import * as React from 'react';
import PurchaserDashboardOverviewPage from '../purchaser/page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function BuyerDashboardPage() {
  return (
    <RoleGuard
      allowedRoles={['BUYER', 'PURCHASER', 'TENANT', 'ADMIN', 'SUPER_ADMIN']}
      dashboardName="Property Buyer Workspace"
      loginPrompt="Sign in to access your saved homes, active builder inquiries, schedule site visits, and explore curated recommendations."
    >
      <PurchaserDashboardOverviewPage />
    </RoleGuard>
  );
}
