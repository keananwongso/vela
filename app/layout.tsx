import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vela — Procurement Intelligence',
  description: 'Enterprise palm oil procurement intelligence dashboard for Riau, Indonesia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
