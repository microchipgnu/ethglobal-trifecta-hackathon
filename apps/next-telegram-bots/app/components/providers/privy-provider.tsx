'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { base } from 'viem/chains';

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_PROJECT_ID,
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['wallet', 'telegram'],
        defaultChain: base,
        supportedChains: [base],
      }}
    >
      {children}
    </Privy>
  );
};
