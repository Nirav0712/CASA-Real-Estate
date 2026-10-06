import { PaymentPurpose } from '../enums/payment.enums';

export interface PricingProduct {
  code: string;
  purpose: PaymentPurpose;
  name: string;
  description: string;
  amount: number; // in INR
  currency: string;
  durationDays: number;
  active: boolean;
}

export const PRICING_CATALOG: Record<string, PricingProduct> = {
  FEATURED_PROPERTY: {
    code: 'FEATURED_PROPERTY',
    purpose: PaymentPurpose.FEATURED_PROPERTY,
    name: 'Featured Property Showcase',
    description: 'Boost listing visibility with top search placement and verified featured badge for 30 days.',
    amount: 1999,
    currency: 'INR',
    durationDays: 30,
    active: true,
  },
  PROPERTY_LISTING: {
    code: 'PROPERTY_LISTING',
    purpose: PaymentPurpose.PROPERTY_LISTING,
    name: 'Standard Listing Promotion',
    description: 'Promote an active listing with enhanced lead routing for 90 days.',
    amount: 999,
    currency: 'INR',
    durationDays: 90,
    active: true,
  },
  PREMIUM_LISTING: {
    code: 'PREMIUM_LISTING',
    purpose: PaymentPurpose.PREMIUM_LISTING,
    name: 'Premium Broker Spotlight',
    description: 'Maximum priority spotlight on marketplace homepage and category searches for 60 days.',
    amount: 4999,
    currency: 'INR',
    durationDays: 60,
    active: true,
  },
  SUBSCRIPTION_PRO: {
    code: 'SUBSCRIPTION_PRO',
    purpose: PaymentPurpose.SUBSCRIPTION,
    name: 'Agent Pro Subscription',
    description: 'Verified badge, unlimited buyer leads, priority indexing, and advanced CRM tools for 30 days.',
    amount: 2499,
    currency: 'INR',
    durationDays: 30,
    active: true,
  },
  SUBSCRIPTION_BUSINESS: {
    code: 'SUBSCRIPTION_BUSINESS',
    purpose: PaymentPurpose.SUBSCRIPTION,
    name: 'Brokerage Business Subscription',
    description: 'Enterprise agency management, multi-agent lead distribution, and analytics for 30 days.',
    amount: 6999,
    currency: 'INR',
    durationDays: 30,
    active: true,
  },
};

export function resolvePricingProduct(purpose: PaymentPurpose, productCode?: string): PricingProduct | null {
  if (productCode && PRICING_CATALOG[productCode]) {
    const product = PRICING_CATALOG[productCode];
    if (product.active && product.purpose === purpose) {
      return product;
    }
  }

  // Fallback match by purpose
  const matched = Object.values(PRICING_CATALOG).find(
    (p) => p.purpose === purpose && p.active,
  );
  return matched || null;
}
