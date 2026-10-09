'use client';

import * as React from 'react';
import {
  fetchLocations,
  fetchLocationChildren,
  LocationSearchParams,
} from '@/services/location-service';
import { LocationItem, LocationType } from '@/types';
import { useLanguage } from '@/contexts/language-context';
import {
  MapPin,
  Globe2,
  Building2,
  ChevronDown,
  Check,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';

export interface SelectedLocationData {
  country?: string;
  countryName?: string;
  countryId?: string;
  state?: string;
  stateName?: string;
  stateId?: string;
  city?: string;
  cityName?: string;
  cityId?: string;
}

interface GlobalLocationSelectorProps {
  value?: SelectedLocationData;
  onChange?: (location: SelectedLocationData) => void;
  variant?: 'hero' | 'header' | 'compact' | 'stacked';
  className?: string;
}

// Global fallback dataset if backend locations API is cold/offline
const FALLBACK_COUNTRIES: Array<{ id: string; name: string; slug: string; code: string; localizedNames?: Record<string, string> }> = [
  { id: 'c-in', name: 'India', slug: 'india', code: 'IN', localizedNames: { en: 'India', hi: 'भारत', ar: 'الهند', ur: 'ہندوستان' } },
  { id: 'c-ae', name: 'United Arab Emirates', slug: 'united-arab-emirates', code: 'AE', localizedNames: { en: 'UAE / Dubai', ar: 'الإمارات', hi: 'दुबई (यूएई)' } },
  { id: 'c-us', name: 'United States', slug: 'united-states', code: 'US', localizedNames: { en: 'United States', hi: 'यूएसए' } },
  { id: 'c-gb', name: 'United Kingdom', slug: 'united-kingdom', code: 'GB', localizedNames: { en: 'United Kingdom (London)', hi: 'यूके' } },
];

const FALLBACK_STATES: Record<string, Array<{ id: string; name: string; slug: string; code: string }>> = {
  india: [
    { id: 's-up', name: 'Uttar Pradesh', slug: 'uttar-pradesh', code: 'UP' },
    { id: 's-mh', name: 'Maharashtra', slug: 'maharashtra', code: 'MH' },
    { id: 's-gj', name: 'Gujarat', slug: 'gujarat', code: 'GJ' },
    { id: 's-ka', name: 'Karnataka', slug: 'karnataka', code: 'KA' },
  ],
  'united-arab-emirates': [
    { id: 's-dxb', name: 'Dubai Emirate', slug: 'dubai-emirate', code: 'DXB' },
    { id: 's-auh', name: 'Abu Dhabi', slug: 'abu-dhabi-emirate', code: 'AUH' },
  ],
  'united-states': [
    { id: 's-ca', name: 'California', slug: 'california', code: 'CA' },
    { id: 's-ny', name: 'New York', slug: 'new-york-state', code: 'NY' },
  ],
  'united-kingdom': [
    { id: 's-eng', name: 'England', slug: 'england', code: 'ENG' },
  ],
};

const FALLBACK_CITIES: Record<string, Array<{ id: string; name: string; slug: string }>> = {
  'uttar-pradesh': [
    { id: 'ct-lko', name: 'Lucknow', slug: 'lucknow' },
    { id: 'ct-knp', name: 'Kanpur', slug: 'kanpur' },
    { id: 'ct-vns', name: 'Varanasi', slug: 'varanasi' },
    { id: 'ct-noida', name: 'Noida / NCR', slug: 'noida' },
    { id: 'ct-ayd', name: 'Ayodhya', slug: 'ayodhya' },
  ],
  maharashtra: [
    { id: 'ct-mum', name: 'Mumbai', slug: 'mumbai' },
    { id: 'ct-pun', name: 'Pune', slug: 'pune' },
    { id: 'ct-nag', name: 'Nagpur', slug: 'nagpur' },
  ],
  gujarat: [
    { id: 'ct-ahm', name: 'Ahmedabad', slug: 'ahmedabad' },
    { id: 'ct-sur', name: 'Surat', slug: 'surat' },
    { id: 'ct-vad', name: 'Vadodara', slug: 'vadodara' },
  ],
  karnataka: [
    { id: 'ct-blr', name: 'Bangalore', slug: 'bangalore' },
    { id: 'ct-mys', name: 'Mysore', slug: 'mysore' },
  ],
  'dubai-emirate': [
    { id: 'ct-dxb', name: 'Dubai City', slug: 'dubai' },
    { id: 'ct-downtown', name: 'Downtown Dubai', slug: 'downtown-dubai' },
    { id: 'ct-marina', name: 'Dubai Marina', slug: 'dubai-marina' },
  ],
  'abu-dhabi-emirate': [
    { id: 'ct-auh', name: 'Abu Dhabi City', slug: 'abu-dhabi' },
  ],
  california: [
    { id: 'ct-sfo', name: 'San Francisco', slug: 'san-francisco' },
    { id: 'ct-la', name: 'Los Angeles', slug: 'los-angeles' },
  ],
  'new-york-state': [
    { id: 'ct-nyc', name: 'New York City', slug: 'new-york-city' },
  ],
  england: [
    { id: 'ct-lon', name: 'London', slug: 'london' },
  ],
};

export function GlobalLocationSelector({
  value,
  onChange,
  variant = 'hero',
  className = '',
}: GlobalLocationSelectorProps) {
  const { locale, t } = useLanguage();

  // Internal state
  const [countries, setCountries] = React.useState<Array<{ id: string; name: string; slug: string; code?: string; localizedNames?: any }>>([]);
  const [states, setStates] = React.useState<Array<{ id: string; name: string; slug: string; code?: string }>>([]);
  const [cities, setCities] = React.useState<Array<{ id: string; name: string; slug: string }>>([]);

  const [selectedCountry, setSelectedCountry] = React.useState<string>(value?.country || 'india');
  const [selectedState, setSelectedState] = React.useState<string>(value?.state || 'all');
  const [selectedCity, setSelectedCity] = React.useState<string>(value?.city || 'all');

  const [loadingCountries, setLoadingCountries] = React.useState(false);
  const [loadingStates, setLoadingStates] = React.useState(false);
  const [loadingCities, setLoadingCities] = React.useState(false);

  // Sync with incoming value if changed
  React.useEffect(() => {
    if (value) {
      if (value.country && value.country !== selectedCountry) setSelectedCountry(value.country);
      if (value.state !== undefined && value.state !== selectedState) setSelectedState(value.state);
      if (value.city !== undefined && value.city !== selectedCity) setSelectedCity(value.city);
    }
  }, [value]);

  // Deduplicate array by slug
  const dedupeBySlug = React.useCallback(<T extends { slug: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      const key = (item.slug || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }, []);

  // Load countries on mount
  React.useEffect(() => {
    async function loadCountries() {
      setLoadingCountries(true);
      try {
        const data = await fetchLocations({ type: 'COUNTRY' });
        if (data && data.length > 0) {
          const raw = data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            code: c.countryCode,
            localizedNames: c.localizedNames,
          }));
          setCountries(dedupeBySlug(raw));
        } else {
          setCountries(dedupeBySlug(FALLBACK_COUNTRIES));
        }
      } catch {
        setCountries(dedupeBySlug(FALLBACK_COUNTRIES));
      } finally {
        setLoadingCountries(false);
      }
    }
    loadCountries();
  }, [dedupeBySlug]);

  // Load states when country changes
  React.useEffect(() => {
    if (!selectedCountry || selectedCountry === 'all') {
      setStates([]);
      setSelectedState('all');
      setCities([]);
      setSelectedCity('all');
      return;
    }

    async function loadStates() {
      setLoadingStates(true);
      try {
        const countryObj = countries.find((c) => c.slug === selectedCountry || c.name.toLowerCase() === selectedCountry.toLowerCase());
        const parentId = countryObj?.id;

        const data = await fetchLocations({
          type: 'STATE',
          parentId: parentId && !parentId.startsWith('c-') ? parentId : undefined,
          countryCode: countryObj?.code,
        });

        if (data && data.length > 0) {
          const raw = data.map((s) => ({ id: s.id, name: s.name, slug: s.slug, code: s.stateCode }));
          setStates(dedupeBySlug(raw));
        } else {
          const fallback = FALLBACK_STATES[selectedCountry] || [];
          setStates(dedupeBySlug(fallback));
        }
      } catch {
        const fallback = FALLBACK_STATES[selectedCountry] || [];
        setStates(dedupeBySlug(fallback));
      } finally {
        setLoadingStates(false);
      }
    }
    loadStates();
  }, [selectedCountry, countries, dedupeBySlug]);

  // Load cities when state changes
  React.useEffect(() => {
    if (!selectedState || selectedState === 'all') {
      // If no state selected but country is selected, offer top cities for fallback or empty
      const stateFallbackKeys = Object.keys(FALLBACK_CITIES);
      const matchingStateKey = stateFallbackKeys.find((k) => k.includes(selectedCountry));
      if (matchingStateKey) {
        setCities(dedupeBySlug(FALLBACK_CITIES[matchingStateKey] || []));
      } else {
        setCities([]);
      }
      setSelectedCity('all');
      return;
    }

    async function loadCities() {
      setLoadingCities(true);
      try {
        const stateObj = states.find((s) => s.slug === selectedState || s.name.toLowerCase() === selectedState.toLowerCase());
        const parentId = stateObj?.id;

        const data = await fetchLocations({
          type: 'CITY',
          parentId: parentId && !parentId.startsWith('s-') ? parentId : undefined,
          stateCode: stateObj?.code,
        });

        if (data && data.length > 0) {
          const raw = data.map((ct) => ({ id: ct.id, name: ct.name, slug: ct.slug }));
          setCities(dedupeBySlug(raw));
        } else {
          const fallback = FALLBACK_CITIES[selectedState] || [];
          setCities(dedupeBySlug(fallback));
        }
      } catch {
        const fallback = FALLBACK_CITIES[selectedState] || [];
        setCities(dedupeBySlug(fallback));
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, [selectedState, states, selectedCountry, dedupeBySlug]);

  // Notify parent on change
  const notifyChange = (newCountry: string, newState: string, newCity: string) => {
    if (!onChange) return;
    const countryObj = countries.find((c) => c.slug === newCountry);
    const stateObj = states.find((s) => s.slug === newState);
    const cityObj = cities.find((ct) => ct.slug === newCity);

    onChange({
      country: newCountry !== 'all' ? newCountry : undefined,
      countryName: countryObj?.name,
      countryId: countryObj?.id,
      state: newState !== 'all' ? newState : undefined,
      stateName: stateObj?.name,
      stateId: stateObj?.id,
      city: newCity !== 'all' ? newCity : undefined,
      cityName: cityObj?.name,
      cityId: cityObj?.id,
    });
  };

  const handleCountryChange = (slug: string) => {
    setSelectedCountry(slug);
    setSelectedState('all');
    setSelectedCity('all');
    notifyChange(slug, 'all', 'all');
  };

  const handleStateChange = (slug: string) => {
    setSelectedState(slug);
    setSelectedCity('all');
    notifyChange(selectedCountry, slug, 'all');
  };

  const handleCityChange = (slug: string) => {
    setSelectedCity(slug);
    notifyChange(selectedCountry, selectedState, slug);
  };

  // Helper for localized country name
  const getCountryDisplayName = (c: { name: string; localizedNames?: any }) => {
    if (c.localizedNames && c.localizedNames[locale]) {
      return c.localizedNames[locale];
    }
    return c.name;
  };

  if (variant === 'stacked') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Country */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1.5 mb-1">
            <Globe2 className="w-3.5 h-3.5 text-casa-brand" />
            <span>Country</span>
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            aria-label="Select Country"
            className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30"
          >
            <option value="all">All Countries (Global)</option>
            {countries.map((c, idx) => (
              <option key={`${c.slug}-${c.id || idx}`} value={c.slug}>
                {getCountryDisplayName(c)}
              </option>
            ))}
          </select>
        </div>

        {/* State / Region */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>State / Region</span>
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={selectedCountry === 'all' || loadingStates}
            aria-label="Select State or Region"
            className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30 disabled:opacity-50"
          >
            <option value="all">
              {loadingStates ? 'Loading States...' : 'All States / Regions'}
            </option>
            {states.map((s, idx) => (
              <option key={`${s.slug}-${s.id || idx}`} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>City</span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={loadingCities}
            aria-label="Select City"
            className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary focus:outline-none focus:ring-2 focus:ring-casa-brand/30 disabled:opacity-50"
          >
            <option value="all">
              {loadingCities ? 'Loading Cities...' : 'All Cities'}
            </option>
            {cities.map((ct, idx) => (
              <option key={`${ct.slug}-${ct.id || idx}`} value={ct.slug}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Default: Responsive Hero / Grid layout
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${className}`}>
      {/* 1. Country Selection */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
          <Globe2 className="w-3 h-3 text-casa-brand" />
          <span>Country</span>
        </label>
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            aria-label="Select Country"
            className="w-full pl-2.5 pr-7 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer appearance-none truncate"
          >
            <option value="all">🌍 All Countries (Global)</option>
            {countries.map((c, idx) => (
              <option key={`${c.slug}-${c.id || idx}`} value={c.slug}>
                📍 {getCountryDisplayName(c)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-casa-text-muted pointer-events-none" />
        </div>
      </div>

      {/* 2. State / Region Selection */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3 text-amber-500" />
          <span>State / Region</span>
        </label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={selectedCountry === 'all' || loadingStates}
            aria-label="Select State or Region"
            className="w-full pl-2.5 pr-7 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer appearance-none truncate disabled:opacity-50"
          >
            <option value="all">
              {loadingStates ? 'Loading regions...' : 'All States / Regions'}
            </option>
            {states.map((s, idx) => (
              <option key={`${s.slug}-${s.id || idx}`} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-casa-text-muted pointer-events-none" />
        </div>
      </div>

      {/* 3. City Selection */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-casa-text-muted flex items-center gap-1 mb-1">
          <Building2 className="w-3 h-3 text-emerald-500" />
          <span>City / Market</span>
        </label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={loadingCities}
            aria-label="Select City"
            className="w-full pl-2.5 pr-7 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-casa-brand/30 cursor-pointer appearance-none truncate disabled:opacity-50"
          >
            <option value="all">
              {loadingCities ? 'Loading cities...' : 'All Cities / Micro-markets'}
            </option>
            {cities.map((ct, idx) => (
              <option key={`${ct.slug}-${ct.id || idx}`} value={ct.slug}>
                {ct.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-casa-text-muted pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
