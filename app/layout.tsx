import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'OrgContact',
  description: 'Okta-backed people search and org chart'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-50">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>{children}</body>
    </html>
  );
}
