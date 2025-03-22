import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
});

import { PrivyProvider } from '@/app/components/privy-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
