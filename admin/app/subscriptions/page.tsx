'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { CreditCard, Check } from 'lucide-react';

export default function SubscriptionsPage() {
  const plans = [
    { name: 'Standard Agent', price: '₹2,499 / mo', listings: '10 Active Listings', badge: false, features: ['Standard search placement', 'Direct buyer phone calls', 'Basic lead CRM'] },
    { name: 'Featured Broker Pro', price: '₹6,999 / mo', listings: '35 Active Listings', badge: true, features: ['Top-of-search featured boost', 'CASA Verified Agent badge', 'SMS lead instant dispatch', 'Priority moderation (<2 hrs)'] },
    { name: 'Developer & Enterprise', price: '₹19,999 / mo', listings: 'Unlimited Projects', badge: true, features: ['Township / Project Showcase banner', 'Dedicated Account Manager', 'Custom 3D Virtual Tour embed', 'API sync integration'] },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Agent Subscriptions & Plans
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Configure monetization tiers, active agent subscriptions, and promotional pricing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.name} className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle flex flex-col justify-between space-y-6 hover:border-casa-brand/40 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-casa-brand bg-casa-brand-subtle px-2.5 py-1 rounded-lg">
                  {p.listings}
                </span>
                {p.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Popular
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-casa-text-primary">{p.name}</h3>
                <div className="text-2xl font-bold text-casa-text-primary mt-1">{p.price}</div>
              </div>

              <ul className="space-y-2 text-xs text-casa-text-secondary pt-4 border-t border-casa-border-light">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs">
              Manage Tier Rules
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
