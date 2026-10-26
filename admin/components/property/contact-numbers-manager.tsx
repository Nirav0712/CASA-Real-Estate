'use client';

import * as React from 'react';
import { Phone, Plus, Trash2, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { ContactNumber } from '@/types';

export interface ContactNumbersManagerProps {
  contactNumbers: ContactNumber[];
  onChange: (contactNumbers: ContactNumber[]) => void;
  disabled?: boolean;
  className?: string;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: '+91 (India)' },
  { code: '+1', country: 'US', label: '+1 (USA/Canada)' },
  { code: '+44', country: 'GB', label: '+44 (UK)' },
  { code: '+971', country: 'AE', label: '+971 (UAE)' },
  { code: '+65', country: 'SG', label: '+65 (Singapore)' },
  { code: '+61', country: 'AU', label: '+61 (Australia)' },
  { code: '+966', country: 'SA', label: '+966 (Saudi Arabia)' },
  { code: '+974', country: 'QA', label: '+974 (Qatar)' },
];

export function normalizeContactNumbers(numbers?: ContactNumber[], fallbackPhone?: string): ContactNumber[] {
  if (Array.isArray(numbers) && numbers.length > 0) {
    const cleaned = numbers.map((n) => ({
      countryCode: n.countryCode || '+91',
      number: (n.number || '').replace(/[^\d]/g, ''),
      isPrimary: Boolean(n.isPrimary),
    }));

    // Ensure exactly one isPrimary
    const primaryIndex = cleaned.findIndex((n) => n.isPrimary);
    if (primaryIndex === -1 && cleaned.length > 0) {
      cleaned[0].isPrimary = true;
    } else if (cleaned.filter((n) => n.isPrimary).length > 1) {
      cleaned.forEach((n, idx) => {
        n.isPrimary = idx === primaryIndex;
      });
    }
    return cleaned;
  }

  // Fallback from legacy phone string
  if (fallbackPhone && fallbackPhone.trim()) {
    const trimmed = fallbackPhone.trim();
    let countryCode = '+91';
    let num = trimmed;
    if (trimmed.startsWith('+')) {
      const match = trimmed.match(/^(\+\d{1,3})(\d+)$/);
      if (match) {
        countryCode = match[1];
        num = match[2];
      }
    } else {
      num = trimmed.replace(/[^\d]/g, '');
    }
    return [{ countryCode, number: num, isPrimary: true }];
  }

  return [{ countryCode: '+91', number: '', isPrimary: true }];
}

export function ContactNumbersManager({
  contactNumbers,
  onChange,
  disabled = false,
  className = '',
}: ContactNumbersManagerProps) {
  // Ensure valid initial array
  const items = React.useMemo(() => {
    if (!contactNumbers || contactNumbers.length === 0) {
      return [{ countryCode: '+91', number: '', isPrimary: true }];
    }
    return contactNumbers;
  }, [contactNumbers]);

  // Track duplicates
  const duplicates = React.useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    items.forEach((item) => {
      const full = `${item.countryCode}${item.number.trim()}`;
      if (item.number.trim().length > 0) {
        if (seen.has(full)) {
          dupes.add(full);
        } else {
          seen.add(full);
        }
      }
    });
    return dupes;
  }, [items]);

  const updateItem = (index: number, patch: Partial<ContactNumber>) => {
    const next = items.map((item, i) => {
      if (i === index) {
        return { ...item, ...patch };
      }
      return item;
    });
    onChange(next);
  };

  const handleSetPrimary = (index: number) => {
    const next = items.map((item, i) => ({
      ...item,
      isPrimary: i === index,
    }));
    onChange(next);
  };

  const handleAddNumber = () => {
    const next = [
      ...items,
      {
        countryCode: '+91',
        number: '',
        isPrimary: items.length === 0,
      },
    ];
    onChange(next);
  };

  const handleRemoveNumber = (index: number) => {
    if (items.length <= 1) return;
    const removedItem = items[index];
    let next = items.filter((_, i) => i !== index);

    // If removed item was primary, designate the first remaining item as primary
    if (removedItem.isPrimary && next.length > 0) {
      next = next.map((item, i) => ({
        ...item,
        isPrimary: i === 0,
      }));
    }

    onChange(next);
  };

  return (
    <div className={`space-y-4 bg-casa-canvas/50 p-4 rounded-2xl border border-casa-border-light ${className}`}>
      <div className="flex items-center justify-between border-b border-casa-border-light pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-casa-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-casa-brand" />
            <span>Contact Numbers</span>
          </h3>
          <p className="text-[11px] text-casa-text-muted mt-0.5">
            Add multiple contact numbers for buyer inquiries. Designate exactly one as Primary.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNumber}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-casa-brand bg-casa-brand-subtle hover:bg-casa-brand hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Another Number</span>
        </button>
      </div>

      {/* Duplicate warning */}
      {duplicates.size > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Duplicate phone number detected. Each contact number must be unique.</span>
        </div>
      )}

      {/* List of contact numbers */}
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const fullKey = `${item.countryCode}${item.number.trim()}`;
          const isDupe = item.number.trim().length > 0 && duplicates.has(fullKey);
          const isValidLength = item.number.length >= 8 && item.number.length <= 13;

          return (
            <div
              key={index}
              className={`p-3 rounded-xl border transition-all ${
                item.isPrimary
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-casa-border-light bg-casa-surface'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Radio to set primary */}
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="admin-primary-contact-number"
                      checked={item.isPrimary}
                      onChange={() => handleSetPrimary(index)}
                      disabled={disabled}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-casa-text-primary">
                      {item.isPrimary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Primary
                        </span>
                      ) : (
                        <span className="text-[11px] text-casa-text-muted hover:text-casa-text-primary">
                          Make Primary
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                {/* Country code & Number Input */}
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={item.countryCode}
                    onChange={(e) => updateItem(index, { countryCode: e.target.value })}
                    disabled={disabled}
                    className="px-2.5 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:border-casa-brand focus:outline-none shrink-0"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={item.number}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^\d]/g, '');
                        updateItem(index, { number: sanitized });
                      }}
                      placeholder="10-digit mobile number"
                      maxLength={14}
                      disabled={disabled}
                      className={`w-full px-3 py-2 text-xs bg-casa-canvas border rounded-xl text-casa-text-primary font-mono tracking-wider focus:outline-none ${
                        isDupe
                          ? 'border-red-500 focus:border-red-500 bg-red-500/5'
                          : 'border-casa-border-light focus:border-casa-brand'
                      }`}
                    />
                    {item.number.length >= 10 && !isDupe && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Delete / Remove Action */}
                <div className="flex items-center justify-end sm:justify-start shrink-0">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveNumber(index)}
                      disabled={disabled || item.isPrimary}
                      title={
                        item.isPrimary
                          ? 'Set another number as primary before removing'
                          : 'Remove this phone number'
                      }
                      className={`p-2 rounded-xl transition-colors ${
                        item.isPrimary
                          ? 'text-casa-text-muted/40 cursor-not-allowed'
                          : 'text-red-500 hover:bg-red-500/10 cursor-pointer'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Individual error hints */}
              {item.number.length > 0 && !isValidLength && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 pl-6">
                  Please enter a valid mobile number (e.g. 10 digits for India).
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
