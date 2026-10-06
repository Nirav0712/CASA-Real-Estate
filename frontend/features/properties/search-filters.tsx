'use client';

import * as React from 'react';
import { SearchPropertiesParams, LocationAutocompleteItem } from '@/types';
import {
  CASA_CATEGORIES,
  getCategoryLabel,
} from '@/lib/categories';
import { useLanguage } from '@/contexts/language-context';
import { formatPrice } from '@/lib/utils';
import { fetchLocationAutocomplete } from '@/services/location-service';
import {
  Search,
  MapPin,
  Building2,
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Home,
  Tag,
  Calendar,
  Layers,
  Compass,
  DollarSign,
} from 'lucide-react';

const POPULAR_CITIES = [
  'All Cities',
  'Lucknow',
  'Ayodhya',
  'Varanasi',
  'Kanpur',
  'Noida',
  'Prayagraj',
  'Gorakhpur',
];

const STANDARD_AMENITIES = [
  '24/7 Gated Security & CCTV',
  '100% Power Backup',
  'Private Landscaped Garden',
  'Covered Car Parking',
  'Swimming Pool & Jacuzzi',
  'Modern Gymnasium',
  'High-Speed Elevators',
  'Solar Water Heating System',
  'Clubhouse & Gym Access',
  'Italian Marble Flooring',
  'Children Play Zone',
  'Intercom Facility',
];

const PRICE_PRESETS = [
  { label: 'Under ₹25L', min: undefined, max: 2500000 },
  { label: '₹25L - ₹50L', min: 2500000, max: 5000000 },
  { label: '₹50L - ₹1 Cr', min: 5000000, max: 10000000 },
  { label: '₹1 Cr - ₹2 Cr', min: 10000000, max: 20000000 },
  { label: '₹2 Cr+', min: 20000000, max: undefined },
];

interface SearchFiltersProps {
  filters: SearchPropertiesParams;
  onFilterChange: (newFilters: Partial<SearchPropertiesParams>) => void;
  onReset: () => void;
  totalResults?: number;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export function SearchFilters({
  filters,
  onFilterChange,
  onReset,
  totalResults,
  isMobileDrawer,
  onCloseMobileDrawer,
}: SearchFiltersProps) {
  const { locale, t } = useLanguage();

  // Local state for immediate inputs before debounce/apply
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(
    filters.amenities ? filters.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
  );

  React.useEffect(() => {
    if (filters.amenities) {
      setSelectedAmenities(filters.amenities.split(',').map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedAmenities([]);
    }
  }, [filters.amenities]);

  const handleAmenityToggle = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    onFilterChange({ amenities: updated.length > 0 ? updated.join(',') : undefined, page: 1 });
  };

  // Location Autocomplete State
  const [locationSearchInput, setLocationSearchInput] = React.useState<string>(
    filters.locality || filters.city || '',
  );
  const [locationSuggestions, setLocationSuggestions] = React.useState<LocationAutocompleteItem[]>([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (filters.locality || filters.city) {
      setLocationSearchInput(filters.locality || filters.city || '');
    } else if (!filters.locationId) {
      setLocationSearchInput('');
    }
  }, [filters.locality, filters.city, filters.locationId]);

  // Debounced autocomplete query
  React.useEffect(() => {
    if (!locationSearchInput || locationSearchInput.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await fetchLocationAutocomplete(locationSearchInput.trim());
        setLocationSuggestions(results);
      } catch (err) {
        setLocationSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [locationSearchInput]);

  const handleSelectLocation = (item: LocationAutocompleteItem) => {
    setLocationSearchInput(item.name);
    setIsLocationDropdownOpen(false);

    if (item.type === 'LOCALITY') {
      onFilterChange({
        locality: item.name,
        localityId: item.id,
        city: item.city || undefined,
        locationId: item.id,
        page: 1,
      });
    } else if (item.type === 'CITY') {
      onFilterChange({
        city: item.name,
        cityId: item.id,
        locality: undefined,
        localityId: undefined,
        locationId: item.id,
        page: 1,
      });
    } else if (item.type === 'STATE') {
      onFilterChange({
        state: item.name,
        stateId: item.id,
        city: undefined,
        locality: undefined,
        locationId: item.id,
        page: 1,
      });
    } else {
      onFilterChange({
        locationId: item.id,
        page: 1,
      });
    }
  };

  const handlePricePreset = (min?: number, max?: number) => {
    onFilterChange({
      minPrice: min !== undefined ? String(min) : undefined,
      maxPrice: max !== undefined ? String(max) : undefined,
      page: 1,
    });
  };

  return (
    <div className="bg-casa-surface border border-casa-border-light rounded-2xl p-5 shadow-xs space-y-6">
      {/* Header with Title & Reset Button */}
      <div className="flex items-center justify-between pb-3 border-b border-casa-border-light">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-casa-brand" />
          <h3 className="text-sm font-bold text-casa-text-primary tracking-tight">
            Filters & Criteria
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-casa-text-muted hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-lg text-casa-text-secondary hover:bg-casa-subtle cursor-pointer lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Keyword Search */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-casa-brand" />
          Keyword / Neighborhood
        </label>
        <div className="relative">
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => onFilterChange({ q: e.target.value || undefined, page: 1 })}
            placeholder="e.g. 4 BHK Villa, Hazratganj, Ekana"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand transition-all text-casa-text-primary"
          />
          <Search className="w-3.5 h-3.5 text-casa-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Listing Type (SALE / RENT / LEASE) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-casa-brand" />
          Listing Type
        </label>
        <div className="grid grid-cols-4 gap-1 p-1 bg-casa-subtle rounded-xl border border-casa-border-light">
          {[
            { id: 'all', label: 'All' },
            { id: 'SALE', label: 'Buy' },
            { id: 'RENT', label: 'Rent' },
            { id: 'LEASE', label: 'Lease' },
          ].map((type) => {
            const isSelected = (!filters.listingType && type.id === 'all') || filters.listingType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    listingType: type.id === 'all' ? undefined : type.id,
                    page: 1,
                  })
                }
                className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-casa-surface text-casa-brand shadow-2xs font-bold'
                    : 'text-casa-text-muted hover:text-casa-text-primary'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-casa-brand" />
          Category
        </label>
        <select
          value={filters.category || 'all'}
          onChange={(e) =>
            onFilterChange({
              category: e.target.value === 'all' ? undefined : e.target.value,
              page: 1,
            })
          }
          className="w-full px-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand transition-all text-casa-text-primary"
        >
          <option value="all">All Categories ({CASA_CATEGORIES.length})</option>
          {CASA_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {getCategoryLabel(cat.name, locale)}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Location: Dynamic Autocomplete & Quick City */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-casa-brand" />
            Location & Micro-Market
          </span>
          {(filters.city || filters.locality || filters.locationId) && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  city: undefined,
                  locality: undefined,
                  state: undefined,
                  locationId: undefined,
                  cityId: undefined,
                  localityId: undefined,
                  page: 1,
                })
              }
              className="text-[10px] text-casa-brand hover:underline cursor-pointer"
            >
              Clear Location
            </button>
          )}
        </label>

        {/* Dynamic Location Search with Autocomplete */}
        <div className="relative">
          <input
            type="text"
            value={locationSearchInput}
            onChange={(e) => {
              setLocationSearchInput(e.target.value);
              setIsLocationDropdownOpen(true);
            }}
            onFocus={() => {
              if (locationSuggestions.length > 0) setIsLocationDropdownOpen(true);
            }}
            placeholder="Type city or locality (e.g. Satellite, Gomti Nagar)..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand transition-all text-casa-text-primary"
          />
          <MapPin className="w-3.5 h-3.5 text-casa-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Autocomplete Dropdown */}
          {isLocationDropdownOpen && locationSuggestions.length > 0 && (
            <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-casa-surface border border-casa-border-light rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-casa-border-light/60">
              {locationSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectLocation(item)}
                  className="w-full px-3 py-2 text-left hover:bg-casa-subtle/70 transition-colors flex flex-col cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-casa-text-primary">{item.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-casa-subtle text-casa-text-muted border border-casa-border-light font-semibold">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-casa-text-muted mt-0.5 truncate">{item.fullPath}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Popular City Selector */}
        <select
          value={filters.city || 'all'}
          onChange={(e) => {
            const val = e.target.value === 'all' || e.target.value === 'All Cities' ? undefined : e.target.value;
            setLocationSearchInput(val || '');
            onFilterChange({
              city: val,
              locationId: undefined,
              cityId: undefined,
              localityId: undefined,
              page: 1,
            });
          }}
          className="w-full px-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand transition-all text-casa-text-primary"
        >
          {POPULAR_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Price Range */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-casa-brand" />
            Price Range (₹)
          </label>
          {(filters.minPrice || filters.maxPrice) && (
            <span className="text-[10px] text-casa-brand font-semibold">
              {filters.minPrice ? formatPrice(Number(filters.minPrice)) : '₹0'} -{' '}
              {filters.maxPrice ? formatPrice(Number(filters.maxPrice)) : 'Any'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            step="50000"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange({ minPrice: e.target.value || undefined, page: 1 })}
            placeholder="Min Price (₹)"
            className="w-full px-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand text-casa-text-primary"
          />
          <input
            type="number"
            min="0"
            step="50000"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange({ maxPrice: e.target.value || undefined, page: 1 })}
            placeholder="Max Price (₹)"
            className="w-full px-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand text-casa-text-primary"
          />
        </div>
        {/* Quick Price Chips */}
        <div className="flex flex-wrap gap-1 pt-1">
          {PRICE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePricePreset(p.min, p.max)}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-casa-subtle hover:bg-casa-brand/10 hover:text-casa-brand border border-casa-border-light text-casa-text-secondary transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Bedrooms (BHK) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-casa-brand" />
          Bedrooms (BHK)
        </label>
        <div className="grid grid-cols-6 gap-1">
          {['all', '1', '2', '3', '4', '5'].map((b) => {
            const isSelected = (!filters.bedrooms && b === 'all') || String(filters.bedrooms) === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() =>
                  onFilterChange({
                    bedrooms: b === 'all' ? undefined : b,
                    page: 1,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-casa-brand text-white border-casa-brand shadow-2xs font-bold'
                    : 'bg-casa-surface text-casa-text-secondary border-casa-border-light hover:border-casa-brand/40'
                }`}
              >
                {b === 'all' ? 'Any' : b === '5' ? '5+' : `${b}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Construction Status */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-casa-brand" />
          Construction Status
        </label>
        <select
          value={filters.constructionStatus || 'all'}
          onChange={(e) =>
            onFilterChange({
              constructionStatus: e.target.value === 'all' ? undefined : e.target.value,
              page: 1,
            })
          }
          className="w-full px-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand text-casa-text-primary"
        >
          <option value="all">All Statuses</option>
          <option value="READY_TO_MOVE">Ready to Move</option>
          <option value="UNDER_CONSTRUCTION">Under Construction</option>
          <option value="NEW_LAUNCH">New Launch</option>
          <option value="RESALE">Resale</option>
        </select>
      </div>

      {/* 8. Furnishing */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary">Furnishing</label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-casa-subtle rounded-xl border border-casa-border-light">
          {[
            { id: 'all', label: 'Any' },
            { id: 'SEMI_FURNISHED', label: 'Semi' },
            { id: 'FURNISHED', label: 'Full' },
          ].map((f) => {
            const isSelected = (!filters.furnishing && f.id === 'all') || filters.furnishing === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    furnishing: f.id === 'all' ? undefined : f.id,
                    page: 1,
                  })
                }
                className={`py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-casa-surface text-casa-brand shadow-2xs font-bold'
                    : 'text-casa-text-muted hover:text-casa-text-primary'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 9. Listing Freshness */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-casa-text-secondary flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-casa-brand" />
          Listing Freshness
        </label>
        <select
          value={filters.freshness || 'all'}
          onChange={(e) =>
            onFilterChange({
              freshness: e.target.value === 'all' ? undefined : e.target.value,
              page: 1,
            })
          }
          className="w-full px-3 py-2 text-xs rounded-xl bg-casa-surface border border-casa-border-light focus:outline-none focus:ring-2 focus:ring-casa-brand/20 focus:border-casa-brand text-casa-text-primary"
        >
          <option value="all">Anytime</option>
          <option value="today">Added in last 24 Hours</option>
          <option value="last_3_days">Added in last 3 Days</option>
          <option value="last_7_days">Added in last 7 Days</option>
          <option value="last_30_days">Added in last 30 Days</option>
        </select>
      </div>

      {/* 10. Featured Only Toggle */}
      <div className="pt-2 border-t border-casa-border-light">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs font-semibold text-casa-text-secondary group-hover:text-casa-brand transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Featured Listings Only
          </span>
          <input
            type="checkbox"
            checked={filters.featured === true || filters.featured === 'true'}
            onChange={(e) =>
              onFilterChange({
                featured: e.target.checked ? true : undefined,
                page: 1,
              })
            }
            className="w-4 h-4 rounded text-casa-brand focus:ring-casa-brand cursor-pointer"
          />
        </label>
      </div>

      {/* 11. Amenities Multi-Select (AND Logic) */}
      <div className="space-y-2 pt-2 border-t border-casa-border-light">
        <label className="text-xs font-semibold text-casa-text-secondary block">
          Amenities (Matches all selected)
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {STANDARD_AMENITIES.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center gap-2 text-[11px] text-casa-text-secondary hover:text-casa-text-primary cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="rounded border-casa-border-light text-casa-brand focus:ring-casa-brand cursor-pointer"
                />
                <span className="truncate">{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Actions */}
      {isMobileDrawer && onCloseMobileDrawer && (
        <div className="pt-4 border-t border-casa-border-light flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 px-3 rounded-xl border border-casa-border-light text-xs font-semibold text-casa-text-secondary hover:bg-casa-subtle"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="flex-1 py-2.5 px-3 rounded-xl bg-casa-brand text-white text-xs font-semibold hover:bg-casa-brand-hover shadow-subtle"
          >
            Show {totalResults !== undefined ? `${totalResults} ` : ''}Results
          </button>
        </div>
      )}
    </div>
  );
}
