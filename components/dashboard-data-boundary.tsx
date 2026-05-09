import type { ReactNode } from 'react';
import { fetchDashboardSnapshot } from '@/lib/dashboard-api';
import type { DashboardSnapshot } from '@/lib/dashboard-types';
import { DashboardDataProvider } from '@/components/dashboard-data-provider';

export default async function DashboardDataBoundary({ children }: { children: ReactNode }) {
  let initialSnapshot: DashboardSnapshot | null = null;

  try {
    initialSnapshot = await fetchDashboardSnapshot();
  } catch {
    initialSnapshot = null;
  }

  return (
    <DashboardDataProvider initialSnapshot={initialSnapshot}>
      {children}
    </DashboardDataProvider>
  );
}
