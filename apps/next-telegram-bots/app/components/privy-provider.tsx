'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { base, baseSepolia } from 'viem/chains';

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
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
        loginMethods: ['telegram', 'wallet'],
        defaultChain: baseSepolia,
        supportedChains: [base, baseSepolia],
      }}
    >
      {children}
    </Privy>
  );
};
