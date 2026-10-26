'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import {
  Settings,
  Database,
  Smartphone,
  PhoneCall,
  MessageCircle,
  Headphones,
  Mail,
  MapPin,
  Clock,
  Save,
  RefreshCw,
  Building2,
} from 'lucide-react';
import {
  getSystemSettings,
  updateSystemSettings,
  SystemSettingsRecord,
} from '@/services/settings-service';

export default function SettingsPage() {
  const toast = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const [form, setForm] = React.useState<SystemSettingsRecord>({
    appName: 'myproperty Marketplace',
    companySalesNumber: '+91 98765 43210',
    companySalesWhatsapp: '+91 98765 43210',
    companyServiceNumber: '+91 98765 43211',
    companySalesEmail: 'sales@myproperty.com',
    companySupportEmail: 'support@myproperty.com',
    companyAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh, 226010',
    trialDays: 3,
    smsProvider: 'msg91',
    smsSenderId: 'MYPROP',
    otpExpiryMinutes: 5,
  });

  const loadSettings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSystemSettings();
      setForm(data);
    } catch (err: any) {
      toast.error('Settings Load Error', err.message || 'Failed to fetch settings from backend');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field: keyof SystemSettingsRecord, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSystemSettings(form);
      toast.success(
        'Configuration Saved',
        'Company contact hotlines, trial parameters, and platform settings saved successfully.',
      );
    } catch (err: any) {
      toast.error('Save Error', err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-casa-surface p-4 sm:p-6 rounded-2xl border border-casa-border-light shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Company Hotlines & Governance Settings
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Configure sales department numbers, customer service contacts, 3-day trial period, and platform gateways.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSettings}
          disabled={isLoading}
          className="text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* COMPANY HOTLINE & SALES CONTACTS */}
        <Card className="p-4 sm:p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-5">
          <div className="flex items-center justify-between border-b border-casa-border-light pb-3">
            <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-casa-brand" />
              Company Sales Department & Customer Service Contacts
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live On Marketplace & Post-Trial
            </span>
          </div>

          <p className="text-xs text-casa-text-secondary leading-relaxed">
            These numbers are prominently displayed to users when their 3-day free trial expires, with a direct 1-click &ldquo;Call Sales Department&rdquo; Call-To-Action (CTA) button to process subscription payments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Sales Dept Number */}
            <div className="p-4 rounded-xl bg-casa-canvas border border-casa-border-light space-y-2">
              <label className="font-bold text-casa-text-primary flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-casa-brand" />
                Sales Call Contact Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98765 43210"
                value={form.companySalesNumber}
                onChange={(e) => handleChange('companySalesNumber', e.target.value)}
                className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs font-semibold focus:outline-none focus:border-casa-brand"
              />
              <span className="text-[11px] text-casa-text-muted block">
                Target phone number for "Call to Subscribe" buttons across marketplace.
              </span>
            </div>

            {/* Sales WhatsApp Number */}
            <div className="p-4 rounded-xl bg-casa-canvas border border-emerald-500/20 space-y-2">
              <label className="font-bold text-casa-text-primary flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                Sales WhatsApp Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98765 43210"
                value={form.companySalesWhatsapp || ''}
                onChange={(e) => handleChange('companySalesWhatsapp', e.target.value)}
                className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-casa-text-muted block">
                Target number for "WhatsApp to Subscribe" prefilled chat requests.
              </span>
            </div>

            {/* Customer Service Number */}
            <div className="p-4 rounded-xl bg-casa-canvas border border-casa-border-light space-y-2">
              <label className="font-bold text-casa-text-primary flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-casa-brand" />
                Support / Service Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98765 43211"
                value={form.companyServiceNumber}
                onChange={(e) => handleChange('companyServiceNumber', e.target.value)}
                className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs font-semibold focus:outline-none focus:border-casa-brand"
              />
              <span className="text-[11px] text-casa-text-muted block">
                Secondary hotline for general user queries and operator assistance.
              </span>
            </div>

            {/* Sales Email */}
            <div>
              <label className="font-semibold text-casa-text-primary block mb-1">
                Sales Department Inquiries Email
              </label>
              <input
                type="email"
                placeholder="sales@casarealestate.com"
                value={form.companySalesEmail}
                onChange={(e) => handleChange('companySalesEmail', e.target.value)}
                className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs focus:outline-none focus:border-casa-brand"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="font-semibold text-casa-text-primary block mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                placeholder="support@casarealestate.com"
                value={form.companySupportEmail}
                onChange={(e) => handleChange('companySupportEmail', e.target.value)}
                className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs focus:outline-none focus:border-casa-brand"
              />
            </div>

            {/* Free Trial Period */}
            <div className="md:col-span-2 p-4 rounded-xl bg-casa-brand-subtle/40 border border-casa-brand/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-casa-text-primary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-casa-brand" />
                  New User Free Trial Period (Days)
                </label>
                <span className="text-xs font-mono font-bold text-casa-brand px-2 py-0.5 rounded bg-white dark:bg-zinc-800">
                  {form.trialDays} Days Full Access
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={form.trialDays}
                onChange={(e) => handleChange('trialDays', Number(e.target.value) || 3)}
                className="w-full px-3 py-2 bg-casa-surface border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs font-semibold focus:outline-none focus:border-casa-brand"
              />
              <span className="text-[11px] text-casa-text-muted block">
                After this period expires, protected services lock and the Sales Contact dial CTA popup appears.
              </span>
            </div>

            {/* Headquarters Address */}
            <div className="md:col-span-2">
              <label className="font-semibold text-casa-text-primary block mb-1">
                Company Headquarters / Legal Address
              </label>
              <input
                type="text"
                value={form.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary text-xs focus:outline-none focus:border-casa-brand"
              />
            </div>
          </div>
        </Card>

        {/* Backend & DB Architecture */}
        <Card className="p-4 sm:p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
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
                defaultValue={process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1'}
                disabled
                className="w-full px-3 py-2 bg-casa-subtle border border-casa-border-light rounded-xl font-mono text-casa-text-muted text-xs cursor-not-allowed"
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
        <Card className="p-4 sm:p-6 bg-casa-surface border border-casa-border-light shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-casa-text-primary flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-casa-brand" />
            Mobile OTP & SMS Gateway Dispatcher
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-casa-text-primary block mb-1">
                Active SMS Provider
              </label>
              <select
                value={form.smsProvider}
                onChange={(e) => handleChange('smsProvider', e.target.value)}
                className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary text-xs"
              >
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
                  value={form.smsSenderId}
                  onChange={(e) => handleChange('smsSenderId', e.target.value)}
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-casa-text-primary block mb-1">
                  OTP Expiry Window (Mins)
                </label>
                <input
                  type="number"
                  value={form.otpExpiryMinutes}
                  onChange={(e) => handleChange('otpExpiryMinutes', Number(e.target.value) || 5)}
                  className="w-full px-3 py-2 bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary text-xs"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSaving}
            className="text-xs px-6 py-2.5 shadow-subtle font-bold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Saving Parameters...' : 'Save Company Hotlines & Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
