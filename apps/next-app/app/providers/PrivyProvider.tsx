'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { baseSepolia, base } from 'viem/chains';

export const PrivyProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: baseSepolia,
        supportedChains: [base, baseSepolia],
      }}
    >
      {children as React.ReactNode}
    </Privy>
  );
};
