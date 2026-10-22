'use client';

import * as React from 'react';
import {
  DetectedLocation,
  detectLocationByIp,
  detectLocationByGps,
} from '@/lib/user-location';

export function useUserLocation() {
  const [detectedLocation, setDetectedLocation] = React.useState<DetectedLocation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGpsLoading, setIsGpsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Auto-detect location on mount using fast IP Geolocation
  React.useEffect(() => {
    let isMounted = true;

    async function initDetection() {
      try {
        setIsLoading(true);
        const loc = await detectLocationByIp();
        if (isMounted) {
          setDetectedLocation(loc);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Unable to detect location.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initDetection();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestGps = React.useCallback(async () => {
    setIsGpsLoading(true);
    try {
      const loc = await detectLocationByGps();
      setDetectedLocation(loc);
      setError(null);
      return loc;
    } catch (err: any) {
      setError(err?.message || 'GPS location permission denied.');
      return null;
    } finally {
      setIsGpsLoading(false);
    }
  }, []);

  const setManualLocation = React.useCallback((loc: DetectedLocation) => {
    setDetectedLocation(loc);
  }, []);

  return {
    detectedLocation,
    isLoading,
    isGpsLoading,
    error,
    requestGps,
    setManualLocation,
  };
}
