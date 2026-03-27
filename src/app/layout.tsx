import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLV — Freebie Hunter',
  description: 'Personal AI agent for hunting freebies, trials & promos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
