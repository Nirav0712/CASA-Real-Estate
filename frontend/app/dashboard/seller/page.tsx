'use client';

import * as React from 'react';
import MyPropertiesPage from '../properties/page';
import { RoleGuard } from '@/components/auth/role-guard';

export default function SellerDashboardPage() {
  return (
    <RoleGuard
      allowedRoles={['PROPERTY_OWNER', 'AGENT', 'BROKER', 'DEVELOPER', 'ADMIN', 'SUPER_ADMIN']}
      dashboardName="Property Seller Workspace"
      loginPrompt="Sign in with your Property Owner credentials to manage property listings, review buyer inquiries, and manage listing statuses."
    >
      <MyPropertiesPage />
    </RoleGuard>
  );
}
