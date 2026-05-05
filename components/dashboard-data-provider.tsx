'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchDashboardSnapshot, getFallbackDashboardSnapshot } from '@/lib/dashboard-api';
import type { DashboardSnapshot } from '@/lib/dashboard-types';

type DashboardDataContextValue = DashboardSnapshot & {
  isRefreshing: boolean;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() => getFallbackDashboardSnapshot());
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    let active = true;

    fetchDashboardSnapshot()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (active) setSnapshot(getFallbackDashboardSnapshot());
      })
      .finally(() => {
        if (active) setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardDataContext.Provider value={{ ...snapshot, isRefreshing }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used inside DashboardDataProvider');
  }
  return context;
}
