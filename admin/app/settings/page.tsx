'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { Settings, Database, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Configuration Saved', 'Platform environment parameters updated successfully.');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Platform & Gateway Governance Settings
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Global environment keys, SMS gateways, and database cluster configuration.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Backend & DB */}
        <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
            <Database className="w-4 h-4 text-casa-brand" />
            Database & Microservices Gateway
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-casa-text-primary block mb-1">
                API Base Gateway Endpoint
              </label>
              <input
                type="text"
                defaultValue="http://localhost:5000/api/v1"
                className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-casa-text-primary block mb-1">
                MongoDB Atlas Active Cluster
              </label>
              <input
                type="text"
                defaultValue="mongodb+srv://cluster0.djn2wkq.mongodb.net/casa_real_estate"
                disabled
                className="w-full px-3 py-2 bg-casa-subtle border border-casa-border-light rounded-xl font-mono text-casa-text-muted text-xs cursor-not-allowed"
              />
              <span className="text-[11px] text-casa-text-muted mt-1 block">
                Network Access: Configured for Permanent Access (0.0.0.0/0).
              </span>
            </div>
          </div>
        </Card>

        {/* SMS Provider */}
        <Card className="p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-casa-brand" />
            Mobile OTP & SMS Gateway Dispatcher
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-casa-text-primary block mb-1">
                Active SMS Provider
              </label>
              <select className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary text-xs">
                <option value="msg91">MSG91 Enterprise (DLT Approved)</option>
                <option value="twilio">Twilio Global Gateway</option>
                <option value="fast2sms">Fast2SMS Quick Dispatch</option>
                <option value="mock">Local Development Mock Provider</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-casa-text-primary block mb-1">
                  Sender ID / Header
                </label>
                <input
                  type="text"
                  defaultValue="CASARE"
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-casa-text-primary block mb-1">
                  OTP Expiry Window (Mins)
                </label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" size="sm" type="submit" className="text-xs">
            Save Platform Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
