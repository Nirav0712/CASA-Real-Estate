'use client';

import * as React from 'react';
import { Plus, Trash2, Ruler, HelpCircle } from 'lucide-react';
import { CustomSize } from '@/types';

export interface CustomSizesManagerProps {
  customSizes: CustomSize[];
  onChange: (sizes: CustomSize[]) => void;
  disabled?: boolean;
}

const COMMON_UNITS = [
  { value: 'SQ_FT', label: 'Sq. Ft.' },
  { value: 'SQ_YARDS', label: 'Sq. Yards' },
  { value: 'SQ_MTR', label: 'Sq. Meters' },
  { value: 'ACRES', label: 'Acres' },
  { value: 'BIGHAS', label: 'Bighas' },
  { value: 'GUNTHA', label: 'Guntha' },
  { value: 'FT', label: 'Feet (ft)' },
  { value: 'METERS', label: 'Meters (m)' },
];

const PRESET_EXAMPLES = [
  { name: 'Plot Size', value: 1200, unit: 'SQ_FT', dimensionsText: '30 × 40 ft' },
  { name: 'Carpet Area', value: 1200, unit: 'SQ_FT', dimensionsText: '1,200 sq. ft.' },
  { name: 'Terrace Area', value: 250, unit: 'SQ_FT', dimensionsText: '250 sq. ft.' },
  { name: 'Shop Dimensions', value: 600, unit: 'SQ_FT', dimensionsText: '20 × 30 ft' },
];

export function CustomSizesManager({
  customSizes = [],
  onChange,
  disabled = false,
}: CustomSizesManagerProps) {
  const [showExamples, setShowExamples] = React.useState(false);

  const handleAdd = () => {
    onChange([
      ...customSizes,
      {
        name: '',
        value: 0,
        unit: 'SQ_FT',
        dimensionsText: '',
      },
    ]);
  };

  const handleApplyPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    onChange([
      ...customSizes,
      {
        name: preset.name,
        value: preset.value,
        unit: preset.unit,
        dimensionsText: preset.dimensionsText,
      },
    ]);
    setShowExamples(false);
  };

  const handleChange = (index: number, field: keyof CustomSize, val: any) => {
    const updated = [...customSizes];
    updated[index] = {
      ...updated[index],
      [field]: field === 'value' ? (val === '' ? '' : Number(val)) : val,
    };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(customSizes.filter((_, i) => i !== index));
  };

  return (
    <div className="pt-3 border-t border-casa-border-light space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-casa-brand" />
          <span className="text-xs font-semibold text-casa-text-primary">
            Custom Dimensions & Specialized Sizes
          </span>
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-[11px] text-casa-brand hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Examples</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-casa-brand text-white hover:bg-casa-brand-dark transition-all disabled:opacity-50 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Size</span>
        </button>
      </div>

      {showExamples && (
        <div className="p-3 bg-casa-canvas/80 rounded-xl border border-casa-border-light text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-casa-text-primary">Popular Presets:</span>
            <span className="text-[10px] text-casa-text-muted">Click to add preset</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyPreset(ex)}
                className="text-left p-2 rounded-lg bg-casa-surface hover:border-casa-brand border border-casa-border-light transition-all group"
              >
                <div className="font-semibold text-casa-text-primary text-[11px] group-hover:text-casa-brand">
                  {ex.name}
                </div>
                <div className="text-[10px] text-casa-text-secondary mt-0.5">
                  {ex.dimensionsText} ({ex.value} {ex.unit})
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {customSizes.length === 0 ? (
        <p className="text-[11px] text-casa-text-muted italic">
          No custom dimensions added yet. Click &quot;Add Custom Size&quot; for terrace area, plot dimensions, shop size, or specialized room metrics.
        </p>
      ) : (
        <div className="space-y-2">
          {customSizes.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-casa-surface rounded-xl border border-casa-border-light grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end transition-all hover:border-casa-brand/40"
            >
              <div className="sm:col-span-4">
                <label className="text-[11px] font-medium text-casa-text-secondary block mb-1">
                  Size Name / Label *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Plot Size, Terrace Area"
                  value={item.name}
                  onChange={(e) => handleChange(idx, 'name', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary font-medium"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-medium text-casa-text-secondary block mb-1">
                  Numeric Value *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 1200"
                  value={typeof item.value === 'number' && !isNaN(item.value) ? item.value : ''}
                  onChange={(e) => handleChange(idx, 'value', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-casa-text-secondary block mb-1">
                  Unit *
                </label>
                <select
                  value={item.unit || 'SQ_FT'}
                  onChange={(e) => handleChange(idx, 'unit', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-casa-text-secondary block mb-1">
                  Dimensions Text
                </label>
                <input
                  type="text"
                  placeholder="e.g., 30 × 40 ft"
                  value={item.dimensionsText || ''}
                  onChange={(e) => handleChange(idx, 'dimensionsText', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs bg-casa-canvas border border-casa-border-light rounded-lg text-casa-text-primary"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled}
                  className="p-1.5 text-casa-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                  title="Remove size"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
