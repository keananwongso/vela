'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tab = pathname.split('/')[1] as 'overview' | 'districts' | 'prices' | 'settings';

  return (
    <div className="app">
      <Sidebar active={tab} />
      <main className="main">{children}</main>
    </div>
  );
}
