'use client';

export interface DetectedLocation {
  city: string;
  citySlug: string;
  state: string;
  stateSlug: string;
  country: string;
  countrySlug: string;
  countryCode: string;
  source: 'ip' | 'gps' | 'cache' | 'default';
}

const STORAGE_KEY = 'casa_user_location_v1';

// Known slug mappings for major Indian & international regions/cities
const CITY_SLUG_MAP: Record<string, string> = {
  ahmedabad: 'ahmedabad',
  amdavad: 'ahmedabad',
  ahmadabad: 'ahmedabad',
  vadodara: 'vadodara',
  baroda: 'vadodara',
  surat: 'surat',
  rajkot: 'rajkot',
  gandhinagar: 'gandhinagar',
  mumbai: 'mumbai',
  bombay: 'mumbai',
  pune: 'pune',
  nagpur: 'nagpur',
  lucknow: 'lucknow',
  kanpur: 'kanpur',
  varanasi: 'varanasi',
  noida: 'noida',
  ayodhya: 'ayodhya',
  delhi: 'delhi',
  'new delhi': 'delhi',
  bengaluru: 'bangalore',
  bangalore: 'bangalore',
  dubai: 'dubai',
  'abu dhabi': 'abu-dhabi',
  london: 'london',
  'new york': 'new-york-city',
};

const STATE_SLUG_MAP: Record<string, string> = {
  gujarat: 'gujarat',
  maharashtra: 'maharashtra',
  'uttar pradesh': 'uttar-pradesh',
  karnataka: 'karnataka',
  delhi: 'delhi',
  dubai: 'dubai-emirate',
  'dubai emirate': 'dubai-emirate',
  'abu dhabi': 'abu-dhabi-emirate',
  california: 'california',
  'new york': 'new-york-state',
  england: 'england',
};

function normalizeSlug(name: string, map?: Record<string, string>): string {
  if (!name) return 'all';
  const clean = name.toLowerCase().trim();
  if (map && map[clean]) return map[clean];
  return clean
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'all';
}

/**
 * Fast client-side location detection using IP Geolocation with multi-provider fallback.
 * Works instantly with zero permissions required.
 */
export async function detectLocationByIp(): Promise<DetectedLocation> {
  // Check cached location if under 4 hours old
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed._timestamp || 0);
        if (age < 4 * 60 * 60 * 1000 && parsed.city) {
          return { ...parsed, source: 'cache' };
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // 1. Primary fast provider: ipwho.is
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.city) {
        const city = data.city;
        const state = data.region || 'Gujarat';
        const country = data.country || 'India';
        const result: DetectedLocation = {
          city,
          citySlug: normalizeSlug(city, CITY_SLUG_MAP),
          state,
          stateSlug: normalizeSlug(state, STATE_SLUG_MAP),
          country,
          countrySlug: normalizeSlug(country),
          countryCode: data.country_code || 'IN',
          source: 'ip',
        };
        saveLocationToCache(result);
        return result;
      }
    }
  } catch {
    // Proceed to fallback provider
  }

  // 2. Secondary fallback provider: BigDataCloud reverse geocode client (free, client-side IP-based)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || 'Ahmedabad';
      const state = data.principalSubdivision || 'Gujarat';
      const country = data.countryName || 'India';
      const result: DetectedLocation = {
        city,
        citySlug: normalizeSlug(city, CITY_SLUG_MAP),
        state,
        stateSlug: normalizeSlug(state, STATE_SLUG_MAP),
        country,
        countrySlug: normalizeSlug(country),
        countryCode: data.countryCode || 'IN',
        source: 'ip',
      };
      saveLocationToCache(result);
      return result;
    }
  } catch {
    // Fall through to safe default
  }

  // Safe default
  return {
    city: 'Ahmedabad',
    citySlug: 'ahmedabad',
    state: 'Gujarat',
    stateSlug: 'gujarat',
    country: 'India',
    countrySlug: 'india',
    countryCode: 'IN',
    source: 'default',
  };
}

/**
 * Precise GPS-based location detection if user explicitly requests or allows browser geolocation.
 */
export async function detectLocationByGps(): Promise<DetectedLocation> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode via BigDataCloud client API
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || 'Ahmedabad';
            const state = data.principalSubdivision || 'Gujarat';
            const country = data.countryName || 'India';

            const result: DetectedLocation = {
              city,
              citySlug: normalizeSlug(city, CITY_SLUG_MAP),
              state,
              stateSlug: normalizeSlug(state, STATE_SLUG_MAP),
              country,
              countrySlug: normalizeSlug(country),
              countryCode: data.countryCode || 'IN',
              source: 'gps',
            };
            saveLocationToCache(result);
            resolve(result);
            return;
          }
          // If reverse geocode fails, fallback to IP detection
          const fallback = await detectLocationByIp();
          resolve(fallback);
        } catch (err: any) {
          reject(err);
        }
      },
      (error) => {
        reject(error);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

function saveLocationToCache(loc: DetectedLocation) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...loc, _timestamp: Date.now() })
    );
  } catch {}
}
