import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Barista Cafe — Bill',
  description: 'View your Barista Cafe bill online. Check itemised receipt, taxes, and total.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
