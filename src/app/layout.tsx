import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Navrang 2026 | Dandiya & Garba Evening | Official Pass Portal',
  description: 'Official digital ticket and registration pass verification portal for Navrang Navratri 2026 at Engineering College Bikaner (ECB).',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Navrang 2026 - Dandiya & Garba Evening',
    description: 'Get your official digital entry pass for Navrang Navratri 2026 at ECB.',
    images: ['/poster.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
