export interface PropertyLocationLike {
  society?: string | null;
  subArea?: string | null;
  area?: string | null;
  locality?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
}

/**
 * Robust location string formatter that:
 * 1. Sanitizes unwanted / wrongly mapped hardcoded fallback strings like "Jhanjha, Lucknow, Uttar Pradesh".
 * 2. Deduplicates overlapping strings (e.g., if locality already mentions the city).
 * 3. Formats valid actual location details cleanly (e.g. "Gomti Nagar, Lucknow" or "Vastrapur, Ahmedabad").
 * 4. Provides a clean professional fallback ("Location on request") when no valid location is present.
 */
export function formatPropertyLocation(
  location?: PropertyLocationLike | string | null,
  options?: { showState?: boolean; fallback?: string }
): string {
  const fallbackText = options?.fallback || 'Location on request';
  if (!location) return fallbackText;

  if (typeof location === 'string') {
    let clean = location.trim();
    // Sanitize unwanted hardcoded text like "Jhanjha, Lucknow, Uttar Pradesh" or similar combos
    clean = clean.replace(/jhanjha,\s*lucknow,\s*uttar\s*pradesh/gi, '');
    clean = clean.replace(/\bjhanjha\b/gi, '').trim();
    clean = clean.replace(/^[\s,]+|[\s,]+$/g, '');
    return clean || fallbackText;
  }

  // Extract raw parts
  let society = (location.society || '').trim();
  let subArea = (location.subArea || '').trim();
  let area = (location.area || '').trim();
  let locality = (location.locality || '').trim();
  const city = (location.city || '').trim();
  const state = (location.state || '').trim();

  // Filter out unwanted placeholder values
  const isJhanjha = (str: string) => /jhanjha/i.test(str);
  if (isJhanjha(locality)) locality = '';
  if (isJhanjha(area)) area = '';
  if (isJhanjha(subArea)) subArea = '';
  if (isJhanjha(society)) society = '';

  // Build clean segments avoiding duplicates
  const segments: string[] = [];
  if (society) segments.push(society);
  if (subArea && !segments.some((s) => s.toLowerCase().includes(subArea.toLowerCase()))) {
    segments.push(subArea);
  }
  const midArea = area || locality;
  if (midArea && !segments.some((s) => s.toLowerCase().includes(midArea.toLowerCase()))) {
    segments.push(midArea);
  }
  if (city && !segments.some((s) => s.toLowerCase().includes(city.toLowerCase()))) {
    segments.push(city);
  }
  if (options?.showState && state && !segments.some((s) => s.toLowerCase().includes(state.toLowerCase()))) {
    segments.push(state);
  }

  // Filter out any unwanted remnants
  const filtered = segments.filter((s) => s && !isJhanjha(s));
  if (filtered.length === 0) return fallbackText;

  return filtered.join(', ');
}
