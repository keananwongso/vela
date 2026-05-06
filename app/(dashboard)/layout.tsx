'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { DashboardDataProvider } from '@/components/dashboard-data-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tab = pathname.split('/')[1] as 'overview' | 'prices' | 'settings';

  return (
    <div className="app">
      <Sidebar active={tab} />
      <main className="main">
        <DashboardDataProvider>{children}</DashboardDataProvider>
      </main>
    </div>
  );
}
