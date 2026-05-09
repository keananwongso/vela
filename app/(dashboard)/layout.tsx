import { Suspense } from 'react';
import type { ReactNode } from 'react';
import DashboardDataBoundary from '@/components/dashboard-data-boundary';
import DashboardLoadingState from '@/components/dashboard-loading-state';
import DashboardShell from '@/components/dashboard-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardLoadingState />}>
      <DashboardShell>
        <DashboardDataBoundary>{children}</DashboardDataBoundary>
      </DashboardShell>
    </Suspense>
  );
}
