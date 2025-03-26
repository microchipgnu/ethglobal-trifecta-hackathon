'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WagmiProvider as WagmiProviderPrivy } from '@privy-io/wagmi';

import { wagmiConfig } from '@/app/components/providers/wagmi-config';
import { cookieToInitialState } from 'wagmi';

const queryClient = new QueryClient();

export const WagmiProvider = ({
  children,
  cookies,
}: { children: React.JSX.Element; cookies: string | null }) => {
  const initialState = cookieToInitialState(wagmiConfig, cookies);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProviderPrivy config={wagmiConfig} initialState={initialState}>
        {children}
      </WagmiProviderPrivy>
    </QueryClientProvider>
  );
};
