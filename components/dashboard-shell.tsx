'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Sidebar from '@/components/sidebar';

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tab = pathname.split('/')[1] as 'overview' | 'prices' | 'settings';

  return (
    <div className="app">
      <Sidebar active={tab} />
      <main className="main">{children}</main>
    </div>
  );
}
