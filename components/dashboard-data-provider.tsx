'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchDashboardSnapshot, getFallbackDashboardSnapshot } from '@/lib/dashboard-api';
import type { DashboardSnapshot } from '@/lib/dashboard-types';
import DashboardLoadingState from '@/components/dashboard-loading-state';

type DashboardDataContextValue = DashboardSnapshot & {
  isRefreshing: boolean;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({
  children,
  initialSnapshot = null,
}: {
  children: ReactNode;
  initialSnapshot?: DashboardSnapshot | null;
}) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(initialSnapshot === null);

  useEffect(() => {
    let active = true;

    if (active) {
      setIsRefreshing(true);
    }

    fetchDashboardSnapshot()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (active && !initialSnapshot) {
          setSnapshot(getFallbackDashboardSnapshot());
        }
      })
      .finally(() => {
        if (active) setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [initialSnapshot]);

  if (snapshot === null && isRefreshing) {
    return <DashboardLoadingState />;
  }

  const resolvedSnapshot = snapshot ?? getFallbackDashboardSnapshot();

  return (
    <DashboardDataContext.Provider value={{ ...resolvedSnapshot, isRefreshing }}>
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
