'use client';

import * as React from 'react';
import { useToast } from './toast-context';

interface ComparisonContextType {
  comparedIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isCompared: (id: string) => boolean;
}

const ComparisonContext = React.createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparedIds, setComparedIds] = React.useState<string[]>([]);
  const toast = useToast();

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('casa_compared_ids');
      if (stored) {
        setComparedIds(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveToStorage = (ids: string[]) => {
    setComparedIds(ids);
    try {
      localStorage.setItem('casa_compared_ids', JSON.stringify(ids));
    } catch {
      // Ignore
    }
  };

  const addToCompare = (id: string) => {
    if (comparedIds.includes(id)) {
      toast.info('Already in comparison', 'This property is already selected.');
      return;
    }
    if (comparedIds.length >= 4) {
      toast.warning('Comparison limit reached', 'You can compare up to 4 properties at a time.');
      return;
    }
    const updated = [...comparedIds, id];
    saveToStorage(updated);
    toast.success('Added to comparison', `${updated.length} of 4 selected.`);
  };

  const removeFromCompare = (id: string) => {
    const updated = comparedIds.filter((item) => item !== id);
    saveToStorage(updated);
  };

  const clearCompare = () => {
    saveToStorage([]);
  };

  const isCompared = (id: string) => comparedIds.includes(id);

  return (
    <ComparisonContext.Provider
      value={{ comparedIds, addToCompare, removeFromCompare, clearCompare, isCompared }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = React.useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
}
