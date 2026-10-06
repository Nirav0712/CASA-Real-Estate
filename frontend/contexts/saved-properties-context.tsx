'use client';

import * as React from 'react';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';
import * as purchaserService from '@/services/purchaser-service';

interface SavedPropertiesContextType {
  savedIds: Set<string>;
  isLoading: boolean;
  isSaved: (propertyId: string) => boolean;
  toggleSave: (propertyId: string, propertyTitle?: string) => Promise<boolean>;
  refreshSaved: () => Promise<void>;
}

const SavedPropertiesContext = React.createContext<SavedPropertiesContextType | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const toast = useToast();
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const refreshSaved = React.useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      return;
    }
    try {
      setIsLoading(true);
      const ids = await purchaserService.getSavedPropertyIds();
      setSavedIds(new Set(ids));
    } catch {
      // Non-critical fallback
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const isSaved = React.useCallback(
    (propertyId: string) => {
      if (!propertyId) return false;
      return savedIds.has(propertyId);
    },
    [savedIds],
  );

  const toggleSave = React.useCallback(
    async (propertyId: string, propertyTitle?: string): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.info('Sign In Required', 'Please sign in to save properties to your favorites shortlist.');
        openAuthModal();
        return false;
      }

      const cleanId = propertyId.trim();
      const currentlySaved = savedIds.has(cleanId);

      // Optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.delete(cleanId);
        } else {
          next.add(cleanId);
        }
        return next;
      });

      try {
        if (currentlySaved) {
          await purchaserService.unsaveProperty(cleanId);
          toast.success('Removed from Saved', propertyTitle || 'Property removed from your shortlist');
        } else {
          await purchaserService.saveProperty(cleanId);
          toast.success('Saved to Favorites', propertyTitle || 'Property added to your shortlist');
        }
        return !currentlySaved;
      } catch (err: unknown) {
        // Revert optimistic update on error
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) {
            next.add(cleanId);
          } else {
            next.delete(cleanId);
          }
          return next;
        });
        const msg = err instanceof Error ? err.message : 'Failed to update saved property';
        toast.error('Action Failed', msg);
        return currentlySaved;
      }
    },
    [isAuthenticated, savedIds, openAuthModal, toast],
  );

  return (
    <SavedPropertiesContext.Provider
      value={{
        savedIds,
        isLoading,
        isSaved,
        toggleSave,
        refreshSaved,
      }}
    >
      {children}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties(): SavedPropertiesContextType {
  const context = React.useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
}
