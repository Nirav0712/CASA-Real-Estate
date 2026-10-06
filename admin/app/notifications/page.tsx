'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { Bell, Send, CheckCircle } from 'lucide-react';

export default function NotificationsPage() {
  const alerts = [
    { title: 'New Agent KYC Application', desc: 'Shubham Tiwari submitted RERA registry for Awadh Realtors', time: '15m ago', type: 'KYC' },
    { title: 'New Property Listing Pending Review', desc: '4 BHK Luxury Villa in Gomti Nagar Extension requires approval', time: '1h ago', type: 'MODERATION' },
    { title: 'Subscription Payment Processed', desc: 'Rajesh Verma renewed Featured Broker Pro plan (₹6,999)', time: '3h ago', type: 'BILLING' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Notifications & SMS Gateway Alerts
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            System dispatch logs, SMS broadcast campaigns, and operator alerts.
          </p>
        </div>

        <Button variant="primary" size="sm" className="text-xs">
          <Send className="w-3.5 h-3.5 mr-1.5" /> Broadcast SMS Advisory
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {alerts.map((a) => (
          <Card key={a.title} className="p-4 bg-casa-surface border border-casa-border-light shadow-subtle flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-casa-brand-subtle text-casa-brand">
                  {a.type}
                </span>
                <span className="text-[11px] text-casa-text-muted">{a.time}</span>
              </div>
              <h3 className="text-sm font-bold text-casa-text-primary">{a.title}</h3>
              <p className="text-xs text-casa-text-secondary">{a.desc}</p>
            </div>

            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          </Card>
        ))}
      </div>
    </div>
  );
}
