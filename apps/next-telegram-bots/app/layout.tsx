import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
});

import { PrivyProvider } from '@/app/components/providers/privy-provider';
import { WagmiProvider } from '@/app/components/providers/wagmi-provider';
import { headers } from 'next/headers';

export default async function RootLayout({
  children,
}: {
  children: React.JSX.Element;
}) {
  const cookies = (await headers()).get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProvider>
          <WagmiProvider cookies={cookies}>{children}</WagmiProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
