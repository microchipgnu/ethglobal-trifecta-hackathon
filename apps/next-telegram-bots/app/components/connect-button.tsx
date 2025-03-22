'use client';

import { usePrivy } from '@privy-io/react-auth';

export const ConnectButton = () => {
  const { login, ready } = usePrivy();

  return (
    <button
      type="button"
      onClick={login}
      disabled={!ready}
      className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-bold transition-colors cursor-pointer disabled:opacity-50"
    >
      Connect Wallet
    </button>
  );
};
