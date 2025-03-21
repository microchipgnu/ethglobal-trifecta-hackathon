'use client';

import { usePrivy } from '@privy-io/react-auth';

export function PrivyAuth() {
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {authenticated ? (
        <div className="flex flex-col items-center gap-4">
          <p>Welcome, {user?.email?.address || user?.wallet?.address || 'User'}!</p>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={login}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login with Privy
        </button>
      )}
    </div>
  );
} 