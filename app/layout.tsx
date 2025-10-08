import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="bg-slate-100">
      <body className="min-h-screen font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
